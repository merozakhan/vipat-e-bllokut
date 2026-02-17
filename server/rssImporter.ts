/**
 * Automated RSS Importer for Albanian News Media
 * 
 * Fetches articles from multiple Albanian media RSS feeds every 3 hours,
 * scrapes full content, downloads images to S3, detects duplicates,
 * and imports new articles with permanent S3 image URLs.
 * 
 * STRICT RULE: Articles are ONLY published if they have ALL three:
 *   1. Title (non-empty)
 *   2. Content/Description (minimum 50 characters)
 *   3. Image (successfully downloaded and uploaded to S3)
 * 
 * Any article missing ANY of these three fields is SKIPPED entirely.
 */

import { getDb } from "./db";
import { articles, categories, articleCategories } from "../drizzle/schema";
import { eq, or, like, desc, isNull, and, not } from "drizzle-orm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// ─── RSS Feed Configuration ─────────────────────────────────────────
interface FeedSource {
  name: string;
  url: string;
  defaultCategory: string;
}

// Only feeds that reliably provide images (80%+ image rate)
const RSS_FEEDS: FeedSource[] = [
  // ─── Original feeds ───
  // Koha.net - main feed (95% with images)
  { name: "Koha.net", url: "https://www.koha.net/rss", defaultCategory: "aktualitet" },
  // Gazeta Express (100% with images)
  { name: "Gazeta Express", url: "https://www.gazetaexpress.com/feed/", defaultCategory: "aktualitet" },
  // Reporter.al (100% with images)
  { name: "Reporter.al", url: "https://reporter.al/feed/", defaultCategory: "aktualitet" },
  // Telegrafi.com (100% with images)
  { name: "Telegrafi.com", url: "https://telegrafi.com/feed/", defaultCategory: "aktualitet" },
  // Albeu.com (100% with images)
  { name: "Albeu.com", url: "https://albeu.com/rss", defaultCategory: "aktualitet" },
  // ─── New feeds (verified 100% images) ───
  // News24.al - Albanian TV news (10 items, 100% images)
  { name: "News24.al", url: "https://www.news24.al/feed/", defaultCategory: "aktualitet" },
  // Vizion Plus - Albanian TV/lifestyle (30 items, 100% images)
  { name: "Vizion Plus", url: "https://vizionplus.tv/feed/", defaultCategory: "aktualitet" },
  // BalkanInsight - Balkan investigative journalism (90 items, 100% images)
  { name: "BalkanInsight", url: "https://balkaninsight.com/feed/", defaultCategory: "botë" },
  // Epoka e Re - Kosovo news (10 items, 100% images)
  { name: "Epoka e Re", url: "https://www.epokaere.com/feed/", defaultCategory: "aktualitet" },
  // Zeri.info - Kosovo news (10 items, 100% images)
  { name: "Zeri.info", url: "https://zeri.info/rss", defaultCategory: "aktualitet" },
];

// Category keyword mapping
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  sport: ["sport", "futboll", "basketboll", "tenis", "olimpik", "kampionat", "ndeshj", "skuadr", "lojtarë", "gol", "liga", "ekip"],
  kulturë: ["kultur", "art", "muzik", "film", "teatr", "libr", "festival", "ekspozit", "performanc", "letërsi", "arkitektur"],
  botë: ["botë", "ndërkombëtar", "global", "trump", "biden", "putin", "nato", "eu", "onu", "okb", "ukraine", "rusi", "kina", "usa", "shba", "amerik", "europ"],
};

// ─── RSS Parsing ─────────────────────────────────────────────────────

interface ParsedArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  imageUrl: string | null;
  source: string;
  category: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8230;/g, "…")
    .replace(/&hellip;/g, "…")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/<![\s\S]*?CDATA[\s\S]*?\]\]>/g, "");
}

function extractText(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  if (!match) return "";
  return decodeHtmlEntities(match[1].trim());
}

function extractImageFromItem(itemXml: string): string | null {
  // Try media:content
  const mediaMatch = itemXml.match(/url=["']([^"']+\.(jpg|jpeg|png|webp|gif)[^"']*)/i);
  if (mediaMatch) return mediaMatch[1];

  // Try enclosure
  const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (enclosureMatch) return enclosureMatch[1];

  // Try image in description/content
  const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return decodeHtmlEntities(imgMatch[1]);

  return null;
}

function parseRssFeed(xml: string, source: FeedSource): ParsedArticle[] {
  const results: ParsedArticle[] = [];

  // Handle Atom feeds (entry tags)
  const isAtom = xml.includes("<entry>");
  const itemTag = isAtom ? "entry" : "item";
  const itemRegex = new RegExp(`<${itemTag}[\\s>][\\s\\S]*?</${itemTag}>`, "gi");
  const items = xml.match(itemRegex) || [];

  for (const item of items) {
    let title = extractText(item, "title");
    if (!title) continue;

    let link = "";
    if (isAtom) {
      const linkMatch = item.match(/<link[^>]+href=["']([^"']+)["']/i);
      link = linkMatch ? linkMatch[1] : "";
    } else {
      link = extractText(item, "link");
    }

    const description = extractText(item, "description") || extractText(item, "summary") || "";
    const pubDate = extractText(item, "pubDate") || extractText(item, "published") || extractText(item, "updated") || "";
    const imageUrl = extractImageFromItem(item);

    // Determine category based on keywords in title/description
    const category = detectCategory(title, description, source.defaultCategory);

    results.push({
      title: title.substring(0, 255),
      link,
      description: stripHtml(description).substring(0, 500),
      pubDate,
      imageUrl,
      source: source.name,
      category,
    });
  }

  return results;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectCategory(title: string, description: string, defaultCat: string): string {
  const text = (title + " " + description).toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return category;
      }
    }
  }
  
  return defaultCat;
}

// ─── Article Validation ─────────────────────────────────────────────

/**
 * STRICT VALIDATION: An article is only valid for publishing if it has
 * ALL three required fields. No exceptions.
 */
interface ValidationResult {
  valid: boolean;
  reason?: string;
}

function validateArticle(title: string, content: string, imageUrl: string | null): ValidationResult {
  if (!title || title.trim().length === 0) {
    return { valid: false, reason: "Missing title" };
  }
  if (!content || content.trim().length < 50) {
    return { valid: false, reason: "Missing or insufficient content (min 50 chars)" };
  }
  if (!imageUrl || imageUrl.trim().length === 0) {
    return { valid: false, reason: "Missing image" };
  }
  return { valid: true };
}

// ─── Image Download & S3 Upload ─────────────────────────────────────

/**
 * Downloads an image from an external URL and uploads it to S3.
 * Returns the permanent S3 URL, or null if the download/upload fails.
 */
async function downloadAndUploadImage(imageUrl: string): Promise<string | null> {
  try {
    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return null;
    }

    // Download the image with browser-like headers
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Referer": parsedUrl.origin + "/",
        "Origin": parsedUrl.origin,
      },
      signal: AbortSignal.timeout(30000),
      redirect: "follow",
    });

    if (!response.ok) {
      console.warn(`[S3 Upload] Failed to download image (${response.status}): ${imageUrl.substring(0, 80)}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());

    // Skip if image is too small (likely a tracking pixel or placeholder)
    if (buffer.byteLength < 1000) {
      return null;
    }

    // Determine file extension from content type
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/avif": "avif",
      "image/svg+xml": "svg",
    };
    const ext = extMap[contentType] || "jpg";

    // Generate unique S3 key
    const uniqueId = nanoid(12);
    const s3Key = `articles/images/${uniqueId}.${ext}`;

    // Upload to S3
    const { url: s3Url } = await storagePut(s3Key, buffer, contentType);
    
    console.log(`[S3 Upload] Uploaded: ${s3Key} (${Math.round(buffer.byteLength / 1024)}KB)`);
    return s3Url;
  } catch (error: any) {
    console.warn(`[S3 Upload] Error: ${error?.message || error}`);
    return null;
  }
}

/**
 * Migrates existing articles with external image URLs to S3.
 * Called once during import to gradually move all images to our storage.
 */
export async function migrateExistingImages(batchSize: number = 10): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  // Find articles with external (non-S3) image URLs
  const articlesToMigrate = await db
    .select({ id: articles.id, featuredImage: articles.featuredImage })
    .from(articles)
    .where(
      and(
        not(like(articles.featuredImage, "%manus-storage%")),
        not(like(articles.featuredImage, "%s3.amazonaws%")),
        not(like(articles.featuredImage, "%cloudfront.net%")),
        // Skip articles with no image
        not(eq(articles.featuredImage, "")),
      )
    )
    .limit(batchSize);

  let migrated = 0;

  for (const article of articlesToMigrate) {
    if (!article.featuredImage) continue;

    const s3Url = await downloadAndUploadImage(article.featuredImage);
    if (s3Url) {
      await db
        .update(articles)
        .set({ featuredImage: s3Url })
        .where(eq(articles.id, article.id));
      migrated++;
    }
  }

  if (migrated > 0) {
    console.log(`[S3 Migration] Migrated ${migrated} article images to S3`);
  }

  return migrated;
}

// ─── Content Scraping ────────────────────────────────────────────────

async function scrapeArticleContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VipatEBllokut/1.0; +https://vipatebllokut.com)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    clearTimeout(timeout);
    if (!response.ok) return null;

    const html = await response.text();

    // Priority 1: Specific article body selectors (most reliable, least CSS junk)
    const specificPatterns = [
      /<div[^>]*class="[^"]*body-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*article-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*story-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*single-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ];

    for (const pattern of specificPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const cleaned = cleanArticleHtml(match[1]);
        if (cleaned.length > 100 && !containsCssJunk(cleaned)) return cleaned;
      }
    }

    // Priority 2: article tag (but extract only paragraphs from it)
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch && articleMatch[1]) {
      const cleaned = cleanArticleHtml(articleMatch[1]);
      if (cleaned.length > 100 && !containsCssJunk(cleaned)) return cleaned;
    }

    // Priority 3: Extract all paragraphs from the page (filtered)
    const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    if (paragraphs.length > 2) {
      const text = paragraphs
        .map(p => stripHtml(p))
        .filter(p => p.length > 30 && !isJunkText(p))
        .join("\n\n");
      if (text.length > 100 && !containsCssJunk(text)) return text;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Checks if text contains CSS/JS junk that shouldn't be in article content.
 * This is the FINAL GATE - if this returns true, the content is rejected.
 */
function containsCssJunk(text: string): boolean {
  const cssPatterns = [
    /\.numbered-teaser/i,
    /\.widget__/i,
    /\.posts-wrapper/i,
    /counter-reset:\s*cnt/i,
    /counter-increment:/i,
    /border-radius:\s*var/i,
    /font-family:\s*var\(/i,
    /background-color:\s*var\(/i,
    /position:\s*absolute/i,
    /display:\s*flex.*justify-content/i,
    /@media\s*\(/i,
    /\.share-facebook/i,
    /\.search-widget/i,
    /\.newsletter-element/i,
    /adIds\s*=/i,
    /getAdHtml/i,
    /injectAds/i,
  ];
  return cssPatterns.some(p => p.test(text));
}

/**
 * Checks if a single paragraph/line is CSS/JS junk.
 */
function isJunkText(text: string): boolean {
  // Lines that start with CSS selectors
  if (/^[.#@{}]/.test(text)) return true;
  // Lines containing CSS property patterns
  if (/\{[^}]*(?:display|color|font|margin|padding|background|border|position|width|height)\s*:/i.test(text)) return true;
  // Lines with CSS var() functions
  if (/var\(--[a-z-]+\)/i.test(text)) return true;
  // Lines with JS patterns
  if (/window\.|document\.|function\s*\(|addEventListener|querySelector|insertAdjacentHTML/i.test(text)) return true;
  // Lines that look like CSS class definitions
  if (/\.[a-z_-]+\s*\{/i.test(text)) return true;
  // Lines with multiple CSS properties
  if ((text.match(/[a-z-]+\s*:\s*[^;]+;/gi) || []).length > 2) return true;
  return false;
}

function cleanArticleHtml(html: string): string {
  // Remove scripts, styles, and other unwanted tags
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Extract paragraphs
  const paragraphs = cleaned.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  const text = paragraphs
    .map(p => stripHtml(p))
    .filter(p => p.length >= 20 && !isJunkText(p))
    .join("\n\n");

  // Cap content at 50000 chars to prevent DB overflow
  const result = text || "";
  return result.substring(0, 50000);
}

// ─── Slug Generation ─────────────────────────────────────────────────

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[ëë]/g, "e")
    .replace(/[çç]/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 200)
    .trim();
}

function generateUniqueSlug(title: string): string {
  const base = generateSlug(title);
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

// ─── Database Operations ─────────────────────────────────────────────

async function getCategoryMap(): Promise<Record<string, number>> {
  const db = await getDb();
  if (!db) return {};

  const cats = await db.select().from(categories);
  const map: Record<string, number> = {};
  for (const cat of cats) {
    map[cat.slug] = cat.id;
  }
  return map;
}

async function articleExists(title: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return true; // Assume exists if DB unavailable to prevent duplicates

  const existing = await db
    .select({ id: articles.id })
    .from(articles)
    .where(like(articles.title, title))
    .limit(1);

  return existing.length > 0;
}

async function insertArticle(
  title: string,
  slug: string,
  content: string,
  excerpt: string,
  imageUrl: string,
  categoryId: number | null,
  publishedAt: Date
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.insert(articles).values({
      title,
      slug,
      content,
      excerpt,
      featuredImage: imageUrl,
      status: "published",
      authorId: 1,
      publishedAt,
    });

    // Get the inserted article ID
    const inserted = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);

    const articleId = inserted[0]?.id;

    // Link to category
    if (articleId && categoryId) {
      await db.insert(articleCategories).values({
        articleId,
        categoryId,
      });
    }

    return articleId || null;
  } catch (error) {
    console.error(`[RSS Import] Failed to insert article: ${title}`, error);
    return null;
  }
}

// ─── Main Import Function ────────────────────────────────────────────

export interface ImportResult {
  totalFetched: number;
  newArticles: number;
  duplicatesSkipped: number;
  skippedNoImage: number;
  skippedNoContent: number;
  errors: number;
  imagesMigrated: number;
  sources: string[];
  timestamp: Date;
}

export async function runRssImport(): Promise<ImportResult> {
  const startTime = Date.now();
  console.log("[RSS Import] Starting automated import...");

  const result: ImportResult = {
    totalFetched: 0,
    newArticles: 0,
    duplicatesSkipped: 0,
    skippedNoImage: 0,
    skippedNoContent: 0,
    errors: 0,
    imagesMigrated: 0,
    sources: [],
    timestamp: new Date(),
  };

  // Get category mapping
  const categoryMap = await getCategoryMap();
  if (Object.keys(categoryMap).length === 0) {
    console.error("[RSS Import] No categories found in database. Aborting.");
    return result;
  }

  // Process each feed
  for (const feed of RSS_FEEDS) {
    try {
      console.log(`[RSS Import] Fetching ${feed.name}: ${feed.url}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(feed.url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; VipatEBllokut/1.0; +https://vipatebllokut.com)",
          "Accept": "application/rss+xml, application/xml, text/xml, application/atom+xml",
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`[RSS Import] Failed to fetch ${feed.name}: ${response.status}`);
        result.errors++;
        continue;
      }

      const xml = await response.text();
      const parsedArticles = parseRssFeed(xml, feed);
      result.totalFetched += parsedArticles.length;
      result.sources.push(feed.name);

      console.log(`[RSS Import] Parsed ${parsedArticles.length} articles from ${feed.name}`);

      // Process each article
      for (const parsed of parsedArticles) {
        try {
          // Check for duplicates
          const exists = await articleExists(parsed.title);
          if (exists) {
            result.duplicatesSkipped++;
            continue;
          }

          // ── STRICT VALIDATION: Step 1 - Must have image in RSS ──
          if (!parsed.imageUrl) {
            console.log(`[RSS Import] SKIPPED (no image in RSS): ${parsed.title.substring(0, 60)}`);
            result.skippedNoImage++;
            continue;
          }

          // Scrape full content
          let fullContent = parsed.description;
          if (parsed.link) {
            const scraped = await scrapeArticleContent(parsed.link);
            if (scraped && scraped.length > fullContent.length && !containsCssJunk(scraped)) {
              fullContent = scraped;
            }
          }

          // FINAL SAFETY CHECK: If content still has CSS junk, fall back to RSS description only
          if (containsCssJunk(fullContent)) {
            console.log(`[RSS Import] Content had CSS junk, using RSS description for: ${parsed.title.substring(0, 60)}`);
            fullContent = parsed.description;
          }

          // Truncate content to prevent DB overflow (MEDIUMTEXT max ~16MB, but cap at 50KB)
          if (fullContent.length > 50000) {
            fullContent = fullContent.substring(0, 50000);
          }

          // ── STRICT VALIDATION: Step 2 - Must have sufficient content ──
          if (fullContent.length < 50) {
            console.log(`[RSS Import] SKIPPED (insufficient content): ${parsed.title.substring(0, 60)}`);
            result.skippedNoContent++;
            continue;
          }

          // ── STRICT VALIDATION: Step 3 - Must successfully upload image to S3 ──
          const s3ImageUrl = await downloadAndUploadImage(parsed.imageUrl);
          if (!s3ImageUrl) {
            console.log(`[RSS Import] SKIPPED (image download/upload failed): ${parsed.title.substring(0, 60)}`);
            result.skippedNoImage++;
            continue;
          }

          // All three validations passed - proceed with publishing
          const validation = validateArticle(parsed.title, fullContent, s3ImageUrl);
          if (!validation.valid) {
            console.log(`[RSS Import] SKIPPED (${validation.reason}): ${parsed.title.substring(0, 60)}`);
            result.errors++;
            continue;
          }

          // Generate slug
          const slug = generateUniqueSlug(parsed.title);

          // Determine category ID
          const categoryId = categoryMap[parsed.category] || categoryMap["aktualitet"] || null;

          // Parse publish date
          let publishedAt = new Date();
          if (parsed.pubDate) {
            const parsed_date = new Date(parsed.pubDate);
            if (!isNaN(parsed_date.getTime())) {
              publishedAt = parsed_date;
            }
          }

          // Insert article with S3 image URL (guaranteed non-null at this point)
          const articleId = await insertArticle(
            parsed.title,
            slug,
            fullContent,
            parsed.description.substring(0, 300) + (parsed.description.length > 300 ? "..." : ""),
            s3ImageUrl,
            categoryId,
            publishedAt
          );

          if (articleId) {
            result.newArticles++;
            console.log(`[RSS Import] ✓ Published: ${parsed.title.substring(0, 60)}`);
          } else {
            result.errors++;
          }
        } catch (error) {
          result.errors++;
          console.error(`[RSS Import] Error processing article: ${parsed.title}`, error);
        }
      }
    } catch (error) {
      result.errors++;
      console.error(`[RSS Import] Error fetching feed ${feed.name}:`, error);
    }
  }

  // After importing new articles, migrate a batch of existing external images to S3
  try {
    const migrated = await migrateExistingImages(15); // Migrate 15 images per cycle
    result.imagesMigrated = migrated;
  } catch (error) {
    console.warn("[RSS Import] Image migration batch failed:", error);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[RSS Import] Complete in ${duration}s: ${result.newArticles} new, ${result.duplicatesSkipped} duplicates, ${result.skippedNoImage} skipped (no image), ${result.skippedNoContent} skipped (no content), ${result.errors} errors, ${result.imagesMigrated} images migrated to S3`);

  return result;
}

// ─── Export feed list for testing ────────────────────────────────────
export { RSS_FEEDS, parseRssFeed, detectCategory, generateSlug, stripHtml, decodeHtmlEntities, downloadAndUploadImage, validateArticle, containsCssJunk, isJunkText };
export type { FeedSource, ParsedArticle };
