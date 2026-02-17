/**
 * Automated RSS Importer for Albanian News Media
 * 
 * Fetches articles from multiple Albanian media RSS feeds every 3 hours,
 * scrapes full content, detects duplicates, and imports new articles.
 */

import { getDb } from "./db";
import { articles, categories, articleCategories } from "../drizzle/schema";
import { eq, or, like, desc } from "drizzle-orm";

// ─── RSS Feed Configuration ─────────────────────────────────────────
interface FeedSource {
  name: string;
  url: string;
  defaultCategory: string;
}

const RSS_FEEDS: FeedSource[] = [
  // Koha.net - main feed
  { name: "Koha.net", url: "https://www.koha.net/rss", defaultCategory: "aktualitet" },
  // Gazeta Express
  { name: "Gazeta Express", url: "https://www.gazetaexpress.com/feed/", defaultCategory: "aktualitet" },
  // Balkanweb - multiple category feeds
  { name: "Balkanweb", url: "https://www.balkanweb.com/feed/", defaultCategory: "aktualitet" },
  { name: "Balkanweb Sport", url: "https://www.balkanweb.com/kategoria/sport/feed/", defaultCategory: "sport" },
  { name: "Balkanweb Ekonomi", url: "https://www.balkanweb.com/kategoria/ekonomi/feed/", defaultCategory: "aktualitet" },
  { name: "Balkanweb Aktualitet", url: "https://www.balkanweb.com/kategoria/aktualitet/feed/", defaultCategory: "aktualitet" },
  // Lapsi.al
  { name: "Lapsi.al", url: "https://lapsi.al/feed/", defaultCategory: "aktualitet" },
  // Panorama
  { name: "Panorama", url: "https://www.panorama.com.al/feed/", defaultCategory: "aktualitet" },
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

    // Try common article content selectors via regex
    const contentPatterns = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class="[^"]*(?:entry-content|article-content|post-content|article-body|story-body|single-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ];

    for (const pattern of contentPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const cleaned = cleanArticleHtml(match[1]);
        if (cleaned.length > 100) return cleaned;
      }
    }

    // Fallback: extract all paragraphs
    const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    if (paragraphs.length > 2) {
      const text = paragraphs
        .map(p => stripHtml(p))
        .filter(p => p.length > 30)
        .join("\n\n");
      if (text.length > 100) return text;
    }

    return null;
  } catch (error) {
    return null;
  }
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
    .replace(/<!--[\s\S]*?-->/g, "");

  // Extract paragraphs
  const paragraphs = cleaned.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  const text = paragraphs
    .map(p => stripHtml(p))
    .filter(p => p.length > 20)
    .join("\n\n");

  return text || stripHtml(cleaned);
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
  imageUrl: string | null,
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
    errors: 0,
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

          // Scrape full content
          let fullContent = parsed.description;
          if (parsed.link) {
            const scraped = await scrapeArticleContent(parsed.link);
            if (scraped && scraped.length > fullContent.length) {
              fullContent = scraped;
            }
          }

          if (fullContent.length < 50) {
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

          // Insert article
          const articleId = await insertArticle(
            parsed.title,
            slug,
            fullContent,
            parsed.description.substring(0, 300) + (parsed.description.length > 300 ? "..." : ""),
            parsed.imageUrl,
            categoryId,
            publishedAt
          );

          if (articleId) {
            result.newArticles++;
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
  console.log(`[RSS Import] Complete in ${duration}s: ${result.newArticles} new, ${result.duplicatesSkipped} duplicates, ${result.errors} errors`);

  return result;
}

// ─── Export feed list for testing ────────────────────────────────────
export { RSS_FEEDS, parseRssFeed, detectCategory, generateSlug, stripHtml, decodeHtmlEntities };
export type { FeedSource, ParsedArticle };
