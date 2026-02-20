/**
 * Automated RSS Importer for Albanian News Media
 * 
 * Fetches articles from multiple Albanian media RSS feeds every 3 hours,
 * scrapes full content, downloads images to Cloudinary, detects duplicates,
 * and imports new articles with permanent Cloudinary image URLs.
 * 
 * STRICT RULE: Articles are ONLY published if they have ALL three:
 *   1. Title (non-empty)
 *   2. Content/Description (minimum 50 characters)
 *   3. Image (successfully downloaded and uploaded to Cloudinary)
 * 
 * Any article missing ANY of these three fields is SKIPPED entirely.
 */

import { getDb } from "./db";
import { articles, categories, articleCategories } from "../drizzle/schema";
import { eq, or, like, desc, and, not } from "drizzle-orm";
import { uploadImageFromUrl } from "./cloudinaryStorage";
import { rewriteArticle } from "./rewriter";

// ─── RSS Feed Configuration ─────────────────────────────────────────
interface FeedSource {
  name: string;
  url: string;
  defaultCategory: string;
}

// Only feeds that reliably provide images (80%+ image rate)
const RSS_FEEDS: FeedSource[] = [
  { name: "Koha.net", url: "https://www.koha.net/rss", defaultCategory: "aktualitet" },
  { name: "Gazeta Express", url: "https://www.gazetaexpress.com/feed/", defaultCategory: "aktualitet" },
  { name: "Reporter.al", url: "https://reporter.al/feed/", defaultCategory: "aktualitet" },
  { name: "Telegrafi.com", url: "https://telegrafi.com/feed/", defaultCategory: "aktualitet" },
  { name: "Albeu.com", url: "https://albeu.com/rss", defaultCategory: "aktualitet" },
  { name: "News24.al", url: "https://www.news24.al/feed/", defaultCategory: "aktualitet" },
  { name: "Vizion Plus", url: "https://vizionplus.tv/feed/", defaultCategory: "aktualitet" },
  { name: "BalkanInsight", url: "https://balkaninsight.com/feed/", defaultCategory: "bote" },
  { name: "Epoka e Re", url: "https://www.epokaere.com/feed/", defaultCategory: "aktualitet" },
  { name: "Zeri.info", url: "https://zeri.info/rss", defaultCategory: "aktualitet" },
];

// Category keyword mapping
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  sport: [
    "sport", "futboll", "basketboll", "tenis", "olimpik", "kampionat",
    "ndeshj", "skuadr", "lojtarë", "gol ", " gola", "liga ", "ekip",
    "champions league", "premier league", "serie a", "la liga",
    "superliga", "kombëtar", "trajner", "transferim", "portier",
    "sulmues", "mbrojtës", "mesfushor", "stadium", "ndeshje",
    "fitore", "humbje", "barazim", "dopietë", "manaj", "hysaj",
    "bajrami", "broja", "rrahmani", "muriqi", "berisha",
    "fifa", "uefa", "fshf", "ffk",
  ],
  kulture: [
    "kultur", "muzik", "film", "teatr", "libr", "festival",
    "ekspozit", "performanc", "letërsi", "arkitektur", "kinema",
    "aktor", "aktore", "regjisor", "koncert", "album", "këng",
    "piktor", "skulptur", "galeri", "muze", "opera", "balet",
    "showbiz", "celebrity", "vip", "big brother", "përputhen",
    "serial", "dokumentar", "artis",
  ],
  bote: [
    "botë", "botër", "ndërkombëtar", "global",
    "trump", "biden", "putin", "macron", "scholz", "zelensky",
    "nato", "onu", "okb", "ukraine", "ukrain",
    "rusi", "kina", "amerik", "europ", "brazil",
    "pentagon", "kreml", "shtëpi e bardhë", "white house",
    "iran", "izrael", "palestin", "gaza", "hamas", "hezbollah",
    "sudan", "afrik", "azi", "lindj", "perëndim",
    "sanksion", "diplomat", "ambasad", "marrëveshj",
    "wagner", "poloni", "gjerman", "franc", "britani",
    "kanada", "australi", "japoni", "indi",
  ],
  ekonomi: [
    "ekonomi", "biznes", "financ", "buxhet", "investim",
    "tregti", "eksport", "import", "banka", "kredi",
    "inflacion", "gdp", "pbb", "tatim", "taksë",
    "punësim", "papunësi", "pagë", "çmim", "treg",
    "kompani", "startup", "sipërmarrj", "borxh",
  ],
  teknologji: [
    "teknologji", "teknologj", "digjital", "internet",
    "softuer", "harduer", "aplikacion", "inteligjenc artificiale",
    "robot", "hapësir", "nasa", "spacex", "satelit",
    "inovacion", "cyber", "haker", "blockchain",
    "smartphone", "apple", "google", "microsoft", "tesla",
  ],
  shendetesi: [
    "shëndet", "shendet", "mjek", "spital", "vaksin",
    "sëmund", "semundj", "kancer", "diabet", "zemr",
    "ilaç", "terapi", "kirurgji", "pandemi", "covid",
    "ushqyer", "ushqim", "dietë", "fruta", "vitamina",
    "stërvit", "gjum", "dush", "energji",
  ],
  politike: [
    "politik", "qever", "kuvend", "parlament", "deputet",
    "ministri", "ministër", "kryeministr", "president",
    "opozit", "mazhoranc", "koalicion", "zgjedhj", "votim",
    "parti", "partia", "kushtetut", "ligjor", "ligj",
    "reformë", "dekret", "vendim", "seancë", "komision",
    "rama", "berisha", "basha", "meta", "veliaj",
    "kurti", "osmani", "thaçi", "haradinaj", "veseli",
    "pd ", " ps ", "lsi", "vetevendosj", "ldk", "aak",
    "prokurori", "gjykat", "spak", "gjyq", "akuz",
    "korrupsion", "hetim", "arrest", "dënoj",
  ],
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
  const mediaMatch = itemXml.match(/url=["']([^"']+\.(jpg|jpeg|png|webp|gif)[^"']*)/i);
  if (mediaMatch) return mediaMatch[1];

  const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (enclosureMatch) return enclosureMatch[1];

  const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return decodeHtmlEntities(imgMatch[1]);

  return null;
}

function parseRssFeed(xml: string, source: FeedSource): ParsedArticle[] {
  const results: ParsedArticle[] = [];

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

    const rssCats = (item.match(/<category[^>]*>([\s\S]*?)<\/category>/gi) || [])
      .map(c => c.replace(/<[^>]+>/g, "").replace(/<!\[CDATA\[|\]\]>/g, "").trim())
      .join(" ");

    const category = detectCategory(title, description + " " + rssCats, source.defaultCategory);

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
  const text = " " + (title + " " + description).toLowerCase() + " ";
  const titleText = " " + title.toLowerCase() + " ";
  const scores: Record<string, number> = {};
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (titleText.includes(keyword)) {
        score += 2;
      } else if (text.includes(keyword)) {
        score += 1;
      }
    }
    if (score > 0) {
      scores[category] = score;
    }
  }
  
  if (Object.keys(scores).length > 0) {
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }
  
  return defaultCat;
}

// ─── Article Validation ─────────────────────────────────────────────

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

    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch && articleMatch[1]) {
      const cleaned = cleanArticleHtml(articleMatch[1]);
      if (cleaned.length > 100 && !containsCssJunk(cleaned)) return cleaned;
    }

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

function isJunkText(text: string): boolean {
  if (/^[.#@{}]/.test(text)) return true;
  if (/\{[^}]*(?:display|color|font|margin|padding|background|border|position|width|height)\s*:/i.test(text)) return true;
  if (/var\(--[a-z-]+\)/i.test(text)) return true;
  if (/window\.|document\.|function\s*\(|addEventListener|querySelector|insertAdjacentHTML/i.test(text)) return true;
  if (/\.[a-z_-]+\s*\{/i.test(text)) return true;
  if ((text.match(/[a-z-]+\s*:\s*[^;]+;/gi) || []).length > 2) return true;
  return false;
}

function cleanArticleHtml(html: string): string {
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

  const paragraphs = cleaned.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  const text = paragraphs
    .map(p => stripHtml(p))
    .filter(p => p.length >= 20 && !isJunkText(p))
    .join("\n\n");

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

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u024F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleSimilarity(a: string, b: string): number {
  const wordsA = normalizeTitle(a).split(" ").filter(w => w.length > 3);
  const wordsB = normalizeTitle(b).split(" ").filter(w => w.length > 3);
  const setB = new Set(wordsB);
  if (wordsA.length === 0 || wordsB.length === 0) return 0;
  const uniqueA = Array.from(new Set(wordsA));
  let overlap = 0;
  for (let i = 0; i < uniqueA.length; i++) {
    if (setB.has(uniqueA[i])) overlap++;
  }
  return overlap / Math.min(uniqueA.length, wordsB.length);
}

let recentTitlesCache: string[] = [];
let cacheLoadedAt = 0;

async function loadRecentTitles(): Promise<string[]> {
  const now = Date.now();
  if (recentTitlesCache.length > 0 && now - cacheLoadedAt < 5 * 60 * 1000) {
    return recentTitlesCache;
  }
  
  const db = await getDb();
  if (!db) return [];
  
  const recent = await db
    .select({ title: articles.title })
    .from(articles)
    .orderBy(desc(articles.publishedAt))
    .limit(1000);
  
  recentTitlesCache = recent.map(r => r.title);
  cacheLoadedAt = now;
  return recentTitlesCache;
}

async function articleExists(title: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return true;

  const existing = await db
    .select({ id: articles.id })
    .from(articles)
    .where(like(articles.title, title))
    .limit(1);

  if (existing.length > 0) return true;

  const recentTitles = await loadRecentTitles();
  for (const existingTitle of recentTitles) {
    if (titleSimilarity(title, existingTitle) >= 0.30) {
      return true;
    }
  }

  return false;
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

    const inserted = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);

    const articleId = inserted[0]?.id;

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
    sources: [],
    timestamp: new Date(),
  };

  const categoryMap = await getCategoryMap();
  if (Object.keys(categoryMap).length === 0) {
    console.error("[RSS Import] No categories found in database. Aborting.");
    return result;
  }

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

      for (const parsed of parsedArticles) {
        try {
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

          if (containsCssJunk(fullContent)) {
            console.log(`[RSS Import] Content had CSS junk, using RSS description for: ${parsed.title.substring(0, 60)}`);
            fullContent = parsed.description;
          }

          if (fullContent.length > 50000) {
            fullContent = fullContent.substring(0, 50000);
          }

          // ── STRICT VALIDATION: Step 2 - Must have sufficient content ──
          if (fullContent.length < 50) {
            console.log(`[RSS Import] SKIPPED (insufficient content): ${parsed.title.substring(0, 60)}`);
            result.skippedNoContent++;
            continue;
          }

          // ── STRICT VALIDATION: Step 3 - Must successfully upload image to Cloudinary ──
          const cloudinaryUrl = await uploadImageFromUrl(parsed.imageUrl);
          if (!cloudinaryUrl) {
            console.log(`[RSS Import] SKIPPED (image upload to Cloudinary failed): ${parsed.title.substring(0, 60)}`);
            result.skippedNoImage++;
            continue;
          }

          // ── LLM REWRITING: Rewrite title and content before publishing ──
          const rewritten = await rewriteArticle(parsed.title, fullContent);
          const finalTitle = rewritten.title || parsed.title;
          const finalContent = rewritten.content || fullContent;

          // All three validations passed
          const validation = validateArticle(finalTitle, finalContent, cloudinaryUrl);
          if (!validation.valid) {
            console.log(`[RSS Import] SKIPPED (${validation.reason}): ${parsed.title.substring(0, 60)}`);
            result.errors++;
            continue;
          }

          const slug = generateUniqueSlug(finalTitle);
          const categoryId = categoryMap[parsed.category] || categoryMap["aktualitet"] || null;

          let publishedAt = new Date();
          if (parsed.pubDate) {
            const parsed_date = new Date(parsed.pubDate);
            if (!isNaN(parsed_date.getTime())) {
              publishedAt = parsed_date;
            }
          }

          // Insert article with Cloudinary image URL
          const articleId = await insertArticle(
            finalTitle,
            slug,
            finalContent,
            parsed.description.substring(0, 300) + (parsed.description.length > 300 ? "..." : ""),
            cloudinaryUrl,
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

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[RSS Import] Complete in ${duration}s: ${result.newArticles} new, ${result.duplicatesSkipped} duplicates, ${result.skippedNoImage} skipped (no image), ${result.skippedNoContent} skipped (no content), ${result.errors} errors`);

  return result;
}

// ─── Export for testing ────────────────────────────────────────────
export { RSS_FEEDS, parseRssFeed, detectCategory, generateSlug, stripHtml, decodeHtmlEntities, validateArticle, containsCssJunk, isJunkText, normalizeTitle, titleSimilarity };
export type { FeedSource, ParsedArticle };
