/**
 * Automated News Scraper for JOQ Albania
 *
 * Scrapes articles from joq-albania.com every 3 hours,
 * downloads images to Cloudinary, detects duplicates,
 * rewrites content, and publishes new articles.
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
import { eq, like, desc } from "drizzle-orm";
import { uploadImageFromUrl } from "./cloudinaryStorage";
import { rewriteArticle } from "./rewriter";

// ─── JOQ Albania Scraper Configuration ──────────────────────────────

const JOQ_BASE_URL = "https://joq-albania.com";
const JOQ_ARTICLE_BASE = `${JOQ_BASE_URL}/artikull/`;

// JOQ category slug → our category slug mapping
const JOQ_CATEGORY_MAP: Record<string, string> = {
  "lajme": "aktualitet",
  "aktualitet": "aktualitet",
  "sport": "sport",
  "bota": "bote",
  "teknologji": "teknologji",
  "argetim": "kulture",
  "argëtim": "kulture",
  "maqedoni": "aktualitet",
  "kosova": "aktualitet",
  "sondazhe": "aktualitet",
  "travel": "aktualitet",
  "udhetime": "aktualitet",
  "shendeti": "shendetesi",
  "shëndeti": "shendetesi",
  "kuriozitete": "aktualitet",
  "thashetheme": "kulture",
  "vec-e-jona": "aktualitet",
  "si-te": "aktualitet",
  "persekutimi-ndaj-joq": "aktualitet",
};

// Category keyword mapping (fallback when JOQ category is missing)
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

// ─── Scraped Article Interface ──────────────────────────────────────

interface ParsedArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  imageUrl: string | null;
  source: string;
  category: string;
}

// ─── JOQ API + Page Scraper ──────────────────────────────────────────

// How many pages to fetch from the load-more API (each page ~24 articles)
const MAX_API_PAGES = 5; // ~100-120 articles per run

interface JoqApiArticle {
  title: string;
  post_date: string;
  image: string;
  link: string;
  cat?: string;
  cat_slug?: string;
  author_name?: string;
  author_lastname?: string;
}

interface JoqApiResponse {
  featured?: JoqApiArticle[];
  top?: JoqApiArticle[];
  last?: JoqApiArticle[];
}

interface JoqArticleLink {
  url: string;
  title: string;
  imageUrl: string | null;
  categorySlug: string | null;
  pubDate: string | null;
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "sq-AL,sq;q=0.9,en;q=0.8",
      },
    });

    clearTimeout(timeout);
    if (!response.ok) return null;

    return await response.text();
  } catch (error) {
    console.error(`[Scraper] Failed to fetch ${url}:`, error);
    return null;
  }
}

async function fetchJoqApiPage(offset: number): Promise<JoqApiArticle[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const url = `https://admin.joq-albania.com/more-home?featuredOffset=${offset}&topOffset=${offset}&lastOffset=${offset}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://joq-albania.com/",
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json, text/html, */*",
      },
    });

    clearTimeout(timeout);
    if (!response.ok) return [];

    const text = await response.text();
    if (!text || text.length < 10) return [];

    const data: JoqApiResponse = JSON.parse(text);
    const allArticles: JoqApiArticle[] = [
      ...(data.featured || []),
      ...(data.top || []),
      ...(data.last || []),
    ];

    return allArticles;
  } catch (error) {
    console.error(`[Scraper] Failed to fetch JOQ API page at offset ${offset}:`, error);
    return [];
  }
}

async function fetchAllJoqArticles(): Promise<JoqArticleLink[]> {
  const seen = new Set<string>();
  const allLinks: JoqArticleLink[] = [];

  // Page through the API (offset starts at 10, 0 returns empty)
  for (let page = 0; page < MAX_API_PAGES; page++) {
    const offset = 10 + (page * 10);
    console.log(`[Scraper] Fetching API page ${page + 1}/${MAX_API_PAGES} (offset=${offset})...`);

    const apiArticles = await fetchJoqApiPage(offset);
    if (apiArticles.length === 0) {
      console.log(`[Scraper] No more articles from API at offset ${offset}`);
      break;
    }

    for (const article of apiArticles) {
      if (!article.link || !article.title) continue;

      const fullUrl = article.link.startsWith("http")
        ? article.link
        : JOQ_BASE_URL + article.link;

      if (seen.has(fullUrl)) continue;
      seen.add(fullUrl);

      allLinks.push({
        url: fullUrl,
        title: article.title,
        imageUrl: article.image || null,
        categorySlug: article.cat_slug || null,
        pubDate: article.post_date || null,
      });
    }

    // Small delay between API pages
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Also scrape homepage for any articles the API might miss
  console.log("[Scraper] Also checking homepage for additional articles...");
  const homepageHtml = await fetchPage(JOQ_BASE_URL);
  if (homepageHtml) {
    const regex = /\/artikull\/(\d+)\.html/g;
    let match;
    while ((match = regex.exec(homepageHtml)) !== null) {
      const fullUrl = JOQ_BASE_URL + match[0];
      if (!seen.has(fullUrl)) {
        seen.add(fullUrl);
        allLinks.push({
          url: fullUrl,
          title: "", // Will be scraped from article page
          imageUrl: null,
          categorySlug: null,
          pubDate: null,
        });
      }
    }
  }

  return allLinks;
}

// ─── Article Page Scraper ───────────────────────────────────────────

interface ScrapedArticle {
  title: string;
  content: string;
  imageUrl: string | null;
  author: string | null;
  publishDate: string | null;
  category: string | null;
}

function scrapeJoqArticlePage(html: string): ScrapedArticle | null {
  // Extract title - try multiple patterns
  let title = "";
  const titlePatterns = [
    /<h1[^>]*>([\s\S]*?)<\/h1>/i,
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<title[^>]*>([\s\S]*?)<\/title>/i,
  ];
  for (const pattern of titlePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      title = stripHtml(match[1]).trim();
      if (title.length > 5) break;
    }
  }

  if (!title || title.length < 5) return null;

  // Extract featured image
  let imageUrl: string | null = null;
  const imgPatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<img[^>]+class="[^"]*featured[^"]*"[^>]+src=["']([^"']+)["']/i,
    /static\.joq-albania\.com\/imagesNew\/[^"'\s]+/i,
  ];
  for (const pattern of imgPatterns) {
    const match = html.match(pattern);
    if (match) {
      imageUrl = match[1] || match[0];
      if (!imageUrl.startsWith("http")) {
        imageUrl = "https://" + imageUrl;
      }
      break;
    }
  }

  // Extract article content - JOQ uses "content-wrapper" div
  let content = "";
  const contentPatterns = [
    /<div[^>]*class="[^"]*content-wrapper[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class="[^"]*(?:related|share|social|comment|ad-|mobile-only|joq-poll)[^"]*")/i,
    /<div[^>]*class="[^"]*content-wrapper[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*body-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*article-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
  ];

  for (const pattern of contentPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const cleaned = cleanArticleHtml(match[1]);
      if (cleaned.length > 100) {
        content = cleaned;
        break;
      }
    }
  }

  // Fallback: extract all paragraphs
  if (content.length < 100) {
    const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    const text = paragraphs
      .map(p => stripHtml(p))
      .filter(p => p.length > 30 && !isJunkText(p))
      .join("\n\n");
    if (text.length > 100) {
      content = text;
    }
  }

  // Extract author
  let author: string | null = null;
  const authorMatch = html.match(/(?:Shkruar nga|author)[^>]*>?\s*([A-Z][a-z]+ [A-Z][a-z]+)/i)
    || html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i);
  if (authorMatch) author = authorMatch[1].trim();

  // Extract publish date
  let publishDate: string | null = null;
  const dateMatch = html.match(/(?:Publikuar më|datePublished)[^>]*>?\s*([\d]{1,2}[./][\d]{1,2}[./][\d]{4}[,\s]*[\d]{1,2}:[\d]{2})/i)
    || html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<time[^>]+datetime=["']([^"']+)["']/i)
    || html.match(/([\d]{1,2}\.[\d]{1,2}\.[\d]{4})/);
  if (dateMatch) publishDate = dateMatch[1].trim();

  // Extract category from page
  let category: string | null = null;
  const catMatch = html.match(/category[_-]?slug["']?\s*[:=]\s*["']([^"']+)["']/i)
    || html.match(/<a[^>]+href=["'][^"']*\/kategori\/([^"'/]+)["']/i)
    || html.match(/<span[^>]*class="[^"]*category[^"]*"[^>]*>([^<]+)<\/span>/i);
  if (catMatch) category = catMatch[1].trim().toLowerCase();

  return { title, content, imageUrl, author, publishDate, category };
}

// ─── Helper Functions ───────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
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

function containsCssJunk(text: string): boolean {
  const cssPatterns = [
    /\.numbered-teaser/i, /\.widget__/i, /\.posts-wrapper/i,
    /counter-reset:\s*cnt/i, /counter-increment:/i,
    /border-radius:\s*var/i, /font-family:\s*var\(/i,
    /background-color:\s*var\(/i, /position:\s*absolute/i,
    /display:\s*flex.*justify-content/i, /@media\s*\(/i,
    /\.share-facebook/i, /\.search-widget/i, /\.newsletter-element/i,
    /adIds\s*=/i, /getAdHtml/i, /injectAds/i,
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

  return (text || "").substring(0, 50000);
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
    console.error(`[Scraper] Failed to insert article: ${title}`, error);
    return null;
  }
}

// ─── Parse JOQ date format (dd.mm.yyyy, HH:MM) ─────────────────────

function parseJoqDate(dateStr: string): Date {
  // Try dd.mm.yyyy, HH:MM format
  const match = dateStr.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})[,\s]*(\d{1,2}):(\d{2})/);
  if (match) {
    const [, day, month, year, hour, minute] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
  }

  // Try ISO format
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) return isoDate;

  return new Date();
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
  console.log("[Scraper] Starting JOQ Albania scrape...");

  const result: ImportResult = {
    totalFetched: 0,
    newArticles: 0,
    duplicatesSkipped: 0,
    skippedNoImage: 0,
    skippedNoContent: 0,
    errors: 0,
    sources: ["JOQ Albania"],
    timestamp: new Date(),
  };

  const categoryMap = await getCategoryMap();
  if (Object.keys(categoryMap).length === 0) {
    console.error("[Scraper] No categories found in database. Aborting.");
    return result;
  }

  // Step 1: Fetch articles from JOQ API + homepage
  const articleLinks = await fetchAllJoqArticles();
  result.totalFetched = articleLinks.length;
  console.log(`[Scraper] Found ${articleLinks.length} unique articles total.`);

  if (articleLinks.length === 0) {
    console.warn("[Scraper] No articles found. JOQ API may be down.");
    result.errors++;
    return result;
  }

  // Step 2: Process each article
  for (const link of articleLinks) {
    try {
      // Check for duplicates using title from API (if available)
      if (link.title && link.title.length > 5) {
        const exists = await articleExists(link.title);
        if (exists) {
          result.duplicatesSkipped++;
          continue;
        }
      }

      // Fetch individual article page for full content
      console.log(`[Scraper] Fetching: ${link.url}`);
      const articleHtml = await fetchPage(link.url);
      if (!articleHtml) {
        console.log(`[Scraper] Failed to fetch article page: ${link.url}`);
        result.errors++;
        continue;
      }

      // Scrape article content
      const scraped = scrapeJoqArticlePage(articleHtml);
      if (!scraped) {
        console.log(`[Scraper] Failed to parse article: ${link.url}`);
        result.errors++;
        continue;
      }

      // Double-check duplicate with scraped title (for articles from homepage without API title)
      if (!link.title || link.title.length <= 5) {
        const exists = await articleExists(scraped.title);
        if (exists) {
          result.duplicatesSkipped++;
          continue;
        }
      }

      // Use API image → scraped image fallback
      const rawImageUrl = link.imageUrl || scraped.imageUrl;

      // ── STRICT VALIDATION: Step 1 - Must have image ──
      if (!rawImageUrl) {
        console.log(`[Scraper] SKIPPED (no image): ${scraped.title.substring(0, 60)}`);
        result.skippedNoImage++;
        continue;
      }

      // ── STRICT VALIDATION: Step 2 - Must have sufficient content ──
      let fullContent = scraped.content;
      if (containsCssJunk(fullContent)) {
        console.log(`[Scraper] Content had CSS junk: ${scraped.title.substring(0, 60)}`);
        fullContent = "";
      }
      if (fullContent.length > 50000) {
        fullContent = fullContent.substring(0, 50000);
      }
      if (fullContent.length < 50) {
        console.log(`[Scraper] SKIPPED (insufficient content): ${scraped.title.substring(0, 60)}`);
        result.skippedNoContent++;
        continue;
      }

      // ── STRICT VALIDATION: Step 3 - Must successfully upload image to Cloudinary ──
      const cloudinaryUrl = await uploadImageFromUrl(rawImageUrl);
      if (!cloudinaryUrl) {
        console.log(`[Scraper] SKIPPED (image upload failed): ${scraped.title.substring(0, 60)}`);
        result.skippedNoImage++;
        continue;
      }

      // ── Rewrite article ──
      const rewritten = await rewriteArticle(scraped.title, fullContent);
      const finalTitle = rewritten.title || scraped.title;
      const finalContent = rewritten.content || fullContent;

      // Final validation
      const validation = validateArticle(finalTitle, finalContent, cloudinaryUrl);
      if (!validation.valid) {
        console.log(`[Scraper] SKIPPED (${validation.reason}): ${scraped.title.substring(0, 60)}`);
        result.errors++;
        continue;
      }

      // Determine category: API cat_slug → page category → keyword detection → default
      let categorySlug = "aktualitet";
      const joqCat = link.categorySlug || scraped.category;
      if (joqCat && JOQ_CATEGORY_MAP[joqCat]) {
        categorySlug = JOQ_CATEGORY_MAP[joqCat];
      } else {
        categorySlug = detectCategory(finalTitle, finalContent, "aktualitet");
      }

      const slug = generateUniqueSlug(finalTitle);
      const categoryId = categoryMap[categorySlug] || categoryMap["aktualitet"] || null;

      let publishedAt = new Date();
      const dateStr = link.pubDate || scraped.publishDate;
      if (dateStr) {
        publishedAt = parseJoqDate(dateStr);
      }

      const excerpt = stripHtml(fullContent).substring(0, 300) + (fullContent.length > 300 ? "..." : "");

      // Insert article
      const articleId = await insertArticle(
        finalTitle,
        slug,
        finalContent,
        excerpt,
        cloudinaryUrl,
        categoryId,
        publishedAt
      );

      if (articleId) {
        result.newArticles++;
        recentTitlesCache.push(finalTitle);
        console.log(`[Scraper] ✓ Published: ${finalTitle.substring(0, 60)}`);
      } else {
        result.errors++;
      }

      // Small delay between articles to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      result.errors++;
      console.error(`[Scraper] Error processing: ${link.url}`, error);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Scraper] Complete in ${duration}s: ${result.newArticles} new, ${result.duplicatesSkipped} duplicates, ${result.skippedNoImage} no image, ${result.skippedNoContent} no content, ${result.errors} errors`);

  return result;
}

// ─── Backward-compatible exports for tests ──────────────────────────
const RSS_FEEDS: { name: string; url: string; defaultCategory: string }[] = [];

function parseRssFeed(): ParsedArticle[] {
  return [];
}

function extractText(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  if (!match) return "";
  return decodeHtmlEntities(match[1].trim());
}

export { RSS_FEEDS, parseRssFeed, detectCategory, generateSlug, stripHtml, decodeHtmlEntities, validateArticle, containsCssJunk, isJunkText, normalizeTitle, titleSimilarity };
export type { ParsedArticle };
// Keep FeedSource type for backward compat
type FeedSource = { name: string; url: string; defaultCategory: string };
export type { FeedSource };
