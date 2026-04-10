/**
 * Automated News Scraper for Albanian News Sites
 *
 * Sources:
 *   - VoxNews (voxnews.al) — Mediadesk platform
 *   - Versus (versus.al) — Mediadesk platform
 *
 * Scrapes articles every 3 hours, downloads images to Cloudinary,
 * detects duplicates, rewrites content, and publishes new articles.
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
import { eq, like, desc, sql } from "drizzle-orm";
import { uploadImageFromUrl } from "./cloudinaryStorage";
import { rewriteArticle } from "./rewriter";

// ─── Blocked Words ──────────────────────────────────────────────────
// Articles containing any of these words (case-insensitive) are skipped entirely.
// Persisted in the `site_settings` table so values survive Railway restarts.
const DEFAULT_BLOCKED_WORDS = ["rraja", "capaj"];
let blockedWords: string[] = [...DEFAULT_BLOCKED_WORDS];
let blockedWordsLoaded = false;
let siteSettingsTableReady = false;

async function ensureSiteSettingsTable(): Promise<void> {
  if (siteSettingsTableReady) return;
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS site_settings (
      \`key\` varchar(64) NOT NULL PRIMARY KEY,
      value text NOT NULL,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    siteSettingsTableReady = true;
  } catch (e) {
    console.warn("[BlockedWords] Failed to ensure site_settings table:", e);
    siteSettingsTableReady = true; // avoid tight retry loops
  }
}

async function loadBlockedWordsFromDb(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await ensureSiteSettingsTable();
  try {
    const rows = await db.execute(
      sql`SELECT value FROM site_settings WHERE \`key\` = 'blocked_words' LIMIT 1`
    );
    // drizzle mysql2 returns [rows, fields] for raw execute
    const record = Array.isArray(rows) ? (rows[0] as any) : (rows as any);
    const first = Array.isArray(record) ? record[0] : record?.[0];
    const value = first?.value;
    if (typeof value === "string" && value.length > 0) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          blockedWords = parsed.map(String);
        }
      } catch {
        // Fallback: comma-separated
        blockedWords = value.split(",").map(w => w.trim()).filter(Boolean);
      }
    }
  } catch (e) {
    console.warn("[BlockedWords] Failed to load from DB:", e);
  }
}

export async function ensureBlockedWordsLoaded(): Promise<void> {
  if (blockedWordsLoaded) return;
  blockedWordsLoaded = true;
  await loadBlockedWordsFromDb();
}

export async function getBlockedWords(): Promise<string[]> {
  await ensureBlockedWordsLoaded();
  return [...blockedWords];
}

export async function setBlockedWords(words: string[]): Promise<void> {
  const normalized = words.map(w => w.toLowerCase().trim()).filter(w => w.length > 0);
  blockedWords = normalized;
  blockedWordsLoaded = true;

  const db = await getDb();
  if (!db) {
    console.warn("[BlockedWords] DB unavailable; change will not persist across restarts");
    return;
  }
  await ensureSiteSettingsTable();
  try {
    const payload = JSON.stringify(normalized);
    await db.execute(sql`
      INSERT INTO site_settings (\`key\`, value) VALUES ('blocked_words', ${payload})
      ON DUPLICATE KEY UPDATE value = ${payload}
    `);
  } catch (e) {
    console.error("[BlockedWords] Failed to persist to DB:", e);
  }
}

function containsBlockedWord(text: string): string | null {
  const lower = text.toLowerCase();
  for (const word of blockedWords) {
    if (lower.includes(word)) return word;
  }
  return null;
}

// Category keyword mapping (fallback when category is missing)
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

interface ArticleLink {
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

// ─── Mediadesk Platform Scraper (VoxNews + Versus) ──────────────────

interface MediadeskSite {
  name: string;
  baseUrl: string;
  categoryPages: string[];
  categoryMap: Record<string, string>;
}

const MEDIADESK_SITES: MediadeskSite[] = [
  {
    name: "VoxNews",
    baseUrl: "https://www.voxnews.al",
    categoryPages: ["aktualitet", "fokus", "investigim", "biznes", "kosovabota", "sport", "lifestyle"],
    categoryMap: {
      aktualitet: "aktualitet",
      fokus: "aktualitet",
      investigim: "aktualitet",
      biznes: "ekonomi",
      kosovabota: "bote",
      sport: "sport",
      lifestyle: "kulture",
      analiza: "politike",
      histori: "kulture",
    },
  },
  {
    name: "Versus",
    baseUrl: "https://versus.al",
    categoryPages: ["politike", "aktualitet", "bota", "ekonomi-mjedis", "magazine", "opinion"],
    categoryMap: {
      politike: "politike",
      aktualitet: "aktualitet",
      bota: "bote",
      "ekonomi-mjedis": "ekonomi",
      magazine: "kulture",
      opinion: "politike",
      zanat: "kulture",
      "live-updates": "aktualitet",
    },
  },
];

/**
 * Scrape a Mediadesk category page for article links.
 * Both VoxNews and Versus use the same platform with /{category}/{slug}-i{id} URLs.
 */
async function scrapeMediadeskCategoryPage(site: MediadeskSite, categorySlug: string): Promise<ArticleLink[]> {
  const url = `${site.baseUrl}/category/${categorySlug}`;
  console.log(`[${site.name}] Fetching category: ${categorySlug}`);

  const html = await fetchPage(url);
  if (!html) {
    console.log(`[${site.name}] Failed to fetch category: ${categorySlug}`);
    return [];
  }

  const links: ArticleLink[] = [];
  // Article URLs: /{category}/{slug}-i{id} — extract from href attributes
  const regex = new RegExp(`href=["']((?:${site.baseUrl})?/[a-z-]+/[^"']*-i(\\d+))["']`, "gi");
  const seen = new Set<string>();
  let match;
  while ((match = regex.exec(html)) !== null) {
    let articleUrl = match[1];
    if (articleUrl.startsWith("/")) articleUrl = site.baseUrl + articleUrl;
    if (seen.has(articleUrl)) continue;
    seen.add(articleUrl);

    // Extract category from URL path
    const pathCat = articleUrl.replace(site.baseUrl, "").split("/")[1] || categorySlug;

    links.push({
      url: articleUrl,
      title: "",
      imageUrl: null,
      categorySlug: pathCat,
      pubDate: null,
    });
  }

  console.log(`[${site.name}] Found ${links.length} articles in ${categorySlug}`);
  return links;
}

/**
 * Fetch all articles from a Mediadesk site across all category pages.
 */
async function fetchAllMediadeskArticles(site: MediadeskSite): Promise<ArticleLink[]> {
  const linkMap = new Map<string, ArticleLink>();

  for (const categorySlug of site.categoryPages) {
    const categoryLinks = await scrapeMediadeskCategoryPage(site, categorySlug);

    for (const link of categoryLinks) {
      const existing = linkMap.get(link.url);
      if (!existing) {
        linkMap.set(link.url, link);
      } else if (
        (existing.categorySlug === "aktualitet" || existing.categorySlug === "te-fundit") &&
        link.categorySlug !== "aktualitet"
      ) {
        existing.categorySlug = link.categorySlug;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return Array.from(linkMap.values());
}

/**
 * Scrape a Mediadesk article page using JSON-LD structured data + HTML fallbacks.
 */
function scrapeMediadeskArticlePage(html: string, siteName: string): ScrapedArticle | null {
  // 1. Try JSON-LD first (most reliable)
  let title = "";
  let imageUrl: string | null = null;
  let publishDate: string | null = null;
  let category: string | null = null;

  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const ld = JSON.parse(jsonLdMatch[1]);
      if (ld.headline) title = ld.headline;
      if (ld.image?.url) imageUrl = ld.image.url;
      else if (typeof ld.image === "string") imageUrl = ld.image;
      if (ld.datePublished) publishDate = ld.datePublished;
    } catch { /* ignore parse errors */ }
  }

  // 2. Fallback: og:title, og:image, h1
  if (!title) {
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    if (ogTitle) title = ogTitle[1];
  }
  if (!title) {
    const h1 = html.match(/<h1[^>]*class=["'][^"']*content-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i)
      || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1) title = stripHtml(h1[1]).trim();
  }
  if (!imageUrl) {
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogImage) imageUrl = ogImage[1];
  }
  if (!publishDate) {
    // Visible date: "22 Mars 2026, 15:25"
    const visDate = html.match(/(\d{1,2})\s+(Janar|Shkurt|Mars|Prill|Maj|Qershor|Korrik|Gusht|Shtator|Tetor|Nentor|Dhjetor)\s+(\d{4}),?\s*(\d{1,2}):(\d{2})/i);
    if (visDate) publishDate = visDate[0];
  }

  if (!title || title.length < 5) return null;

  // 3. Extract content — strip all card/related sections first, then find article body
  // Pre-clean: remove all card sections, related articles, sidebars from HTML before extraction
  let cleanedHtml = html
    .replace(/<div[^>]*class="[^"]*(?:a-card|related|suggested|trending|sidebar|widget|teaser|more-news|article-list|latest-news)[^"]*"[\s\S]*?(?:<\/div>\s*){1,5}/gi, "")
    .replace(/<p[^>]*class="[^"]*(?:a-card_excerpt|excerpt|desc|teaser|card)[^"]*"[^>]*>[\s\S]*?<\/p>/gi, "");

  let content = "";
  const contentPatterns = [
    // layout-form_article-body is the most precise (Mediadesk article body)
    /<div[^>]*class="[^"]*layout-form_article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // content-col stopped before related/share sections
    /<div[^>]*class="[^"]*content-col[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class="[^"]*(?:related|share|social|writer|suggested)[^"]*")/i,
    /<div[^>]*class="[^"]*content-col[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of contentPatterns) {
    const match = cleanedHtml.match(pattern);
    if (match && match[1]) {
      const cleaned = cleanArticleHtml(match[1]);
      if (cleaned.length > 100) {
        content = cleaned;
        break;
      }
    }
  }

  // Fallback: only <p> tags WITHOUT card/excerpt/teaser classes from pre-cleaned HTML
  if (content.length < 100) {
    const paragraphs = cleanedHtml.match(/<p(?:\s[^>]*)?>[\s\S]*?<\/p>/gi) || [];
    const text = paragraphs
      .filter(p => !/class="[^"]*(?:a-card|excerpt|desc|teaser|card|meta|widget)[^"]*"/i.test(p))
      .map(p => stripHtml(p))
      .filter(p => p.length > 30 && !isJunkText(p) && !isSourceBoilerplate(p))
      .join("\n\n");
    if (text.length > 100) content = text;
  }

  // Extract category from breadcrumb or URL
  const catMatch = html.match(/<a[^>]+href=["'][^"']*\/category\/([^"'/]+)["']/i);
  if (catMatch) category = catMatch[1].trim().toLowerCase();

  // Clean branding from title
  title = title
    .replace(/\s*[-–—|]\s*VOX\s*News\s*/gi, "")
    .replace(/\s*[-–—|]\s*Versus\s*/gi, "")
    .replace(/\s*[-–—|]\s*Vox\s*/gi, "")
    .trim();

  return { title, content, imageUrl, author: null, publishDate, category };
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

// Source boilerplate that should be stripped at scrape time
const SOURCE_BOILERPLATE = [
  /versus\s+[eë]sht[eë]\s+nj[eë]\s+media/i,
  /vox\s*(?:news)?\s+[eë]sht[eë]\s+nj[eë]\s+media/i,
  /vox\s+[eë]sht[eë]\s+nj[eë]\s+media/i,
  /d[eë]rgoni\s+informacion/i,
  /m[eë]nyr[eë]\s+anonime/i,
  /raportimi\s+i\s+paansh[eë]m/i,
  /ne\s+q[eë]ndrojm[eë]\s+p[eë]rball[eë]/i,
  /drejtor\s+i\s+p[eë]rgjithsh[eë]m\s*:/i,
  /blerina\s*spaho/i,
  /\+355\s*\d/i,
  /shkruar\s*nga\s*redaksia/i,
  /redaksia\s+(?:vox|versus)/i,
  /n[eë]\s+interes\s+t[eë]\s+publikut/i,
  /nxjerrja\s+n[eë]\s+drit[eë]/i,
  /ka\s+nisur\s+publikimet/i,
  /regjistrohuni\s+m[eë]\s+posht[eë]/i,
  /q[eë]llimi\s+yn[eë]\s+[eë]sht[eë]/i,
  /p[eë]r\s+t['']u\s+informuar\s+mbi\s+lajme/i,
];

function isSourceBoilerplate(text: string): boolean {
  return SOURCE_BOILERPLATE.some(p => p.test(text));
}

function isJunkText(text: string): boolean {
  if (/^[.#@{}]/.test(text)) return true;
  if (/\{[^}]*(?:display|color|font|margin|padding|background|border|position|width|height)\s*:/i.test(text)) return true;
  if (/var\(--[a-z-]+\)/i.test(text)) return true;
  if (/window\.|document\.|function\s*\(|addEventListener|querySelector|insertAdjacentHTML/i.test(text)) return true;
  if (/\.[a-z_-]+\s*\{/i.test(text)) return true;
  if ((text.match(/[a-z-]+\s*:\s*[^;]+;/gi) || []).length > 2) return true;
  if (isSourceBoilerplate(text)) return true;
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
    .replace(/<!--[\s\S]*?-->/g, "")
    // Remove entire card/teaser/related sections (these contain other articles)
    .replace(/<div[^>]*class="[^"]*(?:a-card|related|suggested|trending|sidebar|widget|teaser|more-news|article-list)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "")
    // Remove p tags with card/excerpt/desc classes (other article teasers)
    .replace(/<p[^>]*class="[^"]*(?:a-card_excerpt|excerpt|desc|teaser|card)[^"]*"[^>]*>[\s\S]*?<\/p>/gi, "");

  // Only get <p> tags without suspicious classes
  const paragraphs = cleaned.match(/<p(?:\s[^>]*)?>[\s\S]*?<\/p>/gi) || [];
  const text = paragraphs
    .filter(p => {
      // Skip p tags with card/excerpt/teaser classes
      if (/class="[^"]*(?:a-card|excerpt|desc|teaser|card|meta|widget)[^"]*"/i.test(p)) return false;
      return true;
    })
    .map(p => stripHtml(p))
    .filter(p => {
      if (p.length < 20) return false;
      if (isJunkText(p)) return false;
      if (isSourceBoilerplate(p)) return false;
      return true;
    })
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

const DEFAULT_CATEGORIES = [
  { name: "Të Gjitha", slug: "te-gjitha", description: "Lajme të përgjithshme" },
  { name: "Showbiz", slug: "showbiz", description: "Lajme nga bota e showbizit" },
  { name: "Sports", slug: "sports", description: "Lajme sportive" },
  { name: "Horoskopi", slug: "horoskopi", description: "Horoskopi ditor" },
];

async function seedDefaultCategories(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  for (const cat of DEFAULT_CATEGORIES) {
    try {
      await db.insert(categories).values(cat).onDuplicateKeyUpdate({ set: { name: cat.name } });
    } catch (e) {
      console.warn(`[Scraper] Failed to seed category ${cat.slug}:`, e);
    }
  }
}

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

// Common Albanian words that appear in many titles but don't indicate duplicates
const COMMON_WORDS = new Set([
  "shqiperi", "shqiperise", "qeveria", "ministri", "kryeministri",
  "eshte", "jane", "kane", "para", "mire", "keq", "madhe", "vogel",
  "ndaj", "sipas", "mund", "duhet", "rreth", "gjate", "deri", "pritet",
  "sot", "neser", "dje", "java", "muaji", "viti", "dite", "ore",
  "tirana", "tirane", "kosove", "kosoves", "prishtine", "shkoder",
  "policia", "gjykata", "prokuroria", "parlamenti", "kuvendi",
  "lajme", "lajmi", "artikull", "deklarate", "vendimi", "ligji",
  "mund", "nder", "pasi", "nese", "keshtu", "atehere", "megjithate",
]);

function titleSimilarity(a: string, b: string): number {
  const wordsA = normalizeTitle(a).split(" ").filter(w => w.length > 3 && !COMMON_WORDS.has(w));
  const wordsB = normalizeTitle(b).split(" ").filter(w => w.length > 3 && !COMMON_WORDS.has(w));
  const setB = new Set(wordsB);
  if (wordsA.length === 0 || wordsB.length === 0) return 0;
  const uniqueA = Array.from(new Set(wordsA));
  let overlap = 0;
  for (let i = 0; i < uniqueA.length; i++) {
    if (setB.has(uniqueA[i])) overlap++;
  }
  // Require overlap in BOTH directions (not just min)
  const ratioA = overlap / uniqueA.length;
  const ratioB = overlap / new Set(wordsB).size;
  return Math.min(ratioA, ratioB);
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
    if (titleSimilarity(title, existingTitle) >= 0.85) {
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

// ─── Parse article date format (dd.mm.yyyy, HH:MM) ─────────────────

const ALBANIAN_MONTHS: Record<string, number> = {
  janar: 0, shkurt: 1, mars: 2, prill: 3, maj: 4, qershor: 5,
  korrik: 6, gusht: 7, shtator: 8, tetor: 9, nentor: 10, nëntor: 10, dhjetor: 11,
};

function parseArticleDate(dateStr: string): Date {
  // Try ISO format first (JSON-LD: "2026-03-22T15:25:00+01:00")
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime()) && dateStr.includes("T")) return isoDate;

  // Try dd.mm.yyyy, HH:MM format (e.g. "22.03.2026, 18:00")
  const dotMatch = dateStr.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})[,\s]*(\d{1,2}):(\d{2})/);
  if (dotMatch) {
    const [, day, month, year, hour, minute] = dotMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
  }

  // Try Albanian month name (Mediadesk: "22 Mars 2026, 15:25")
  const albMatch = dateStr.match(/(\d{1,2})\s+([A-Za-zëË]+)\s+(\d{4})[,\s]*(\d{1,2}):(\d{2})/i);
  if (albMatch) {
    const [, day, monthName, year, hour, minute] = albMatch;
    const monthIdx = ALBANIAN_MONTHS[monthName.toLowerCase()];
    if (monthIdx !== undefined) {
      return new Date(parseInt(year), monthIdx, parseInt(day), parseInt(hour), parseInt(minute));
    }
  }

  // Fallback
  if (!isNaN(isoDate.getTime())) return isoDate;
  return new Date();
}

// Keep backward compat alias

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
  console.log("[Scraper] Starting multi-source scrape...");

  // Reload blocked words from DB so changes made via admin panel take effect
  // on the next scrape run even after a server restart.
  blockedWordsLoaded = false;
  await ensureBlockedWordsLoaded();
  console.log(`[Scraper] Blocked words loaded (${blockedWords.length}): ${blockedWords.join(", ") || "(none)"}`);

  const result: ImportResult = {
    totalFetched: 0,
    newArticles: 0,
    duplicatesSkipped: 0,
    skippedNoImage: 0,
    skippedNoContent: 0,
    errors: 0,
    sources: ["VoxNews", "Versus"],
    timestamp: new Date(),
  };

  let categoryMap = await getCategoryMap();
  if (Object.keys(categoryMap).length === 0) {
    console.log("[Scraper] No categories found. Auto-seeding default categories...");
    await seedDefaultCategories();
    categoryMap = await getCategoryMap();
    if (Object.keys(categoryMap).length === 0) {
      console.error("[Scraper] Failed to seed categories. Aborting.");
      return result;
    }
    console.log(`[Scraper] Seeded ${Object.keys(categoryMap).length} categories.`);
  }

  // Step 1: Fetch articles from all sources
  const articleLinks: ArticleLink[] = [];
  for (const site of MEDIADESK_SITES) {
    try {
      const siteLinks = await fetchAllMediadeskArticles(site);
      for (const link of siteLinks) (link as any)._source = site.name.toLowerCase();
      articleLinks.push(...siteLinks);
      console.log(`[Scraper] ${site.name}: ${siteLinks.length} articles`);
    } catch (e) {
      console.error(`[Scraper] ${site.name} failed:`, e);
      result.errors++;
    }
  }
  result.totalFetched = articleLinks.length;
  console.log(`[Scraper] Total: ${articleLinks.length} articles from ${result.sources.length} sources`);

  if (articleLinks.length === 0) {
    console.warn("[Scraper] No articles found from any source.");
    result.errors++;
    return result;
  }

  // Max new articles to publish per run
  const MAX_NEW_PER_RUN = 50;

  // Sort by article ID descending (newest first)
  // Mediadesk: /{cat}/{slug}-i{id}
  articleLinks.sort((a, b) => {
    const idA = parseInt(a.url.match(/-i(\d+)$/)?.[1] || "0");
    const idB = parseInt(b.url.match(/-i(\d+)$/)?.[1] || "0");
    return idB - idA;
  });

  // Shuffle to mix sources (prevents one source dominating all 50 slots)
  // Strategy: interleave sources so we get ~17 from each
  const bySource = new Map<string, ArticleLink[]>();
  for (const link of articleLinks) {
    const src = (link as any)._source || "unknown";
    if (!bySource.has(src)) bySource.set(src, []);
    bySource.get(src)!.push(link);
  }
  const interleaved: ArticleLink[] = [];
  const sources = Array.from(bySource.values());
  const maxLen = Math.max(...sources.map(s => s.length));
  for (let i = 0; i < maxLen; i++) {
    for (const sourceLinks of sources) {
      if (i < sourceLinks.length) interleaved.push(sourceLinks[i]);
    }
  }
  articleLinks.length = 0;
  articleLinks.push(...interleaved);

  // Track consecutive duplicates - if we hit 15 in a row, the rest are likely all old
  let consecutiveDuplicates = 0;
  const MAX_CONSECUTIVE_DUPES = 30;

  // Step 2: Process each article (newest first)
  for (const link of articleLinks) {
    // Stop once we've published enough new articles this run
    if (result.newArticles >= MAX_NEW_PER_RUN) {
      console.log(`[Scraper] Reached limit of ${MAX_NEW_PER_RUN} new articles. Stopping.`);
      break;
    }

    // Stop early if we keep hitting duplicates (all remaining are likely old)
    if (consecutiveDuplicates >= MAX_CONSECUTIVE_DUPES) {
      console.log(`[Scraper] Hit ${MAX_CONSECUTIVE_DUPES} consecutive duplicates. Rest are likely old. Stopping.`);
      break;
    }

    try {
      // Check for duplicates using title from API (if available)
      if (link.title && link.title.length > 5) {
        const exists = await articleExists(link.title);
        if (exists) {
          result.duplicatesSkipped++;
          consecutiveDuplicates++;
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

      // Scrape article content using the Mediadesk parser
      const source = (link as any)._source || "unknown";
      const scraped = scrapeMediadeskArticlePage(articleHtml, source);
      if (!scraped) {
        console.log(`[Scraper] Failed to parse article: ${link.url}`);
        result.errors++;
        continue;
      }

      // Double-check duplicate with scraped title (for articles without pre-known title)
      if (!link.title || link.title.length <= 5) {
        const exists = await articleExists(scraped.title);
        if (exists) {
          result.duplicatesSkipped++;
          consecutiveDuplicates++;
          continue;
        }
      }

      // ── BLOCKLIST CHECK: skip articles with blocked words ──
      const blockedIn = containsBlockedWord(scraped.title) || containsBlockedWord(scraped.content);
      if (blockedIn) {
        console.log(`[Scraper] BLOCKED (word "${blockedIn}"): ${scraped.title.substring(0, 60)}`);
        result.errors++;
        continue;
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

      // All articles go into the single "Të Gjitha" category
      const categorySlug = "te-gjitha";

      const slug = generateUniqueSlug(finalTitle);
      const categoryId = categoryMap[categorySlug] || categoryMap["aktualitet"] || null;

      let publishedAt = new Date();
      const dateStr = link.pubDate || scraped.publishDate;
      if (dateStr) {
        publishedAt = parseArticleDate(dateStr);
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
        consecutiveDuplicates = 0;  // Reset - we found a new article
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

// ─── Horoscope Scraper ──────────────────────────────────────────────

const ZODIAC_SIGNS = [
  { name: "Dashi", slug: "dashi", english: "aries", dates: "21 Mars - 19 Prill" },
  { name: "Demi", slug: "demi", english: "taurus", dates: "20 Prill - 20 Maj" },
  { name: "Binjakët", slug: "binjaket", english: "gemini", dates: "21 Maj - 20 Qershor" },
  { name: "Gaforrja", slug: "gaforrja", english: "cancer", dates: "21 Qershor - 22 Korrik" },
  { name: "Luani", slug: "luani", english: "leo", dates: "23 Korrik - 22 Gusht" },
  { name: "Virgjëresha", slug: "virgjeresha", english: "virgo", dates: "23 Gusht - 22 Shtator" },
  { name: "Peshorja", slug: "peshorja", english: "libra", dates: "23 Shtator - 22 Tetor" },
  { name: "Akrepi", slug: "akrepi", english: "scorpio", dates: "23 Tetor - 21 Nëntor" },
  { name: "Shigjetari", slug: "shigjetari", english: "sagittarius", dates: "22 Nëntor - 21 Dhjetor" },
  { name: "Bricjapi", slug: "bricjapi", english: "capricorn", dates: "22 Dhjetor - 19 Janar" },
  { name: "Ujori", slug: "ujori", english: "aquarius", dates: "20 Janar - 18 Shkurt" },
  { name: "Peshqit", slug: "peshqit", english: "pisces", dates: "19 Shkurt - 20 Mars" },
];

function getSignIconUrl(english: string): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dp8mbbbm4";
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_40,h_40,c_fit/vipat-horoscope/sign-${english}.png`;
}

const HOROSCOPE_URLS = {
  ditor: "https://www.horoskopishqip.com/horoskopi-ditor/",
  javor: "https://www.horoskopishqip.com/horoskopi-javor/",
  mujor: "https://www.horoskopishqip.com/horoskopi-mujor/",
};

const HOROSCOPE_LABELS: Record<string, string> = {
  ditor: "Ditor",
  javor: "Javor",
  mujor: "Mujor",
};

/**
 * Parse all 12 zodiac sign texts from a horoscope HTML page.
 * Uses multiple strategies: date-based, class-based, name-based, and section-based.
 */
function parseHoroscopeSigns(html: string): { name: string; english: string; dates: string; text: string }[] {
  const results: { name: string; english: string; dates: string; text: string }[] = [];

  for (const sign of ZODIAC_SIGNS) {
    const escapedDates = sign.dates.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedName = sign.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      // Pattern 1: dates followed by a paragraph
      new RegExp(`${escapedDates}[\\s\\S]*?<\\/[^>]+>\\s*<p[^>]*>([\\s\\S]*?)<\\/p>`, "i"),
      // Pattern 2: class containing the sign slug
      new RegExp(`sign_${sign.slug}[\\s\\S]{0,500}?<p[^>]*>([\\s\\S]*?)<\\/p>`, "i"),
      // Pattern 3: sign name in a heading/link followed by paragraph
      new RegExp(`>${escapedName}<\\/[^>]+>[\\s\\S]*?<p[^>]*>([\\s\\S]*?)<\\/p>`, "i"),
      // Pattern 4: sign name in any tag, then grab all text until next sign or section
      new RegExp(`${escapedName}[\\s\\S]{0,100}?${escapedDates}[\\s\\S]*?<p[^>]*>([\\s\\S]*?)<\\/p>`, "i"),
      // Pattern 5: broader — sign name anywhere, grab the nearest <p> after it
      new RegExp(`${escapedName}[\\s\\S]{0,300}?<p[^>]*>([\\s\\S]*?)<\\/p>`, "i"),
      // Pattern 6: sign name in a div/section, grab text content (no <p> tags)
      new RegExp(`>${escapedName}<[\\s\\S]{0,200}?${escapedDates}[\\s\\S]{0,100}?<\\/[^>]+>\\s*([^<]{30,})`, "i"),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const cleaned = match[1].replace(/<[^>]*>/g, "").trim();
        if (cleaned.length > 30) {
          results.push({ name: sign.name, english: sign.english, dates: sign.dates, text: cleaned });
          break;
        }
      }
    }
  }

  return results;
}

/**
 * Scrape one horoscope type and create a SINGLE beautiful article with all 12 signs.
 */
async function scrapeHoroscopeType(type: "ditor" | "javor" | "mujor"): Promise<boolean> {
  const label = HOROSCOPE_LABELS[type];
  const url = HOROSCOPE_URLS[type];
  console.log(`[Horoscope] Scraping ${label}...`);

  const db = await getDb();
  if (!db) return false;

  const horoskopiCat = await db.select().from(categories).where(eq(categories.slug, "horoskopi")).limit(1);
  if (horoskopiCat.length === 0) { console.error("[Horoscope] 'horoskopi' category not found."); return false; }
  const categoryId = horoskopiCat[0].id;

  const teGjithaCat = await db.select().from(categories).where(eq(categories.slug, "te-gjitha")).limit(1);
  const teGjithaId = teGjithaCat[0]?.id;

  // Check if this type already exists for today/this week/this month
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const checkSlug = type === "ditor"
    ? `horoskopi-ditor-${todayStr}`
    : `horoskopi-${type}-${todayStr.substring(0, 7)}`;

  const existing = await db.select({ id: articles.id }).from(articles)
    .where(like(articles.slug, `${checkSlug}%`)).limit(1);
  if (existing.length > 0) {
    console.log(`[Horoscope] ${label} already exists. Skipping.`);
    return false;
  }

  // Retry up to 3 times with delay — source can be flaky
  let html: string | null = null;
  let signs: { name: string; english: string; dates: string; text: string }[] = [];
  for (let attempt = 1; attempt <= 3; attempt++) {
    html = await fetchPage(url);
    if (!html) {
      console.warn(`[Horoscope] Attempt ${attempt}/3: failed to fetch ${label} page.`);
      if (attempt < 3) await new Promise(r => setTimeout(r, 5000 * attempt));
      continue;
    }
    signs = parseHoroscopeSigns(html);
    if (signs.length >= 6) break; // At least half the signs parsed = good enough
    console.warn(`[Horoscope] Attempt ${attempt}/3: only ${signs.length} signs parsed for ${label}.`);
    if (attempt < 3) await new Promise(r => setTimeout(r, 5000 * attempt));
  }
  if (!html) { console.error(`[Horoscope] Failed to fetch ${label} after 3 attempts.`); return false; }
  if (signs.length === 0) { console.error(`[Horoscope] No signs parsed for ${label} after 3 attempts.`); return false; }

  // Build one beautiful article with all signs
  const dateFormatted = today.toLocaleDateString("sq-AL", { day: "numeric", month: "long", year: "numeric" });
  const title = `Horoskopi ${label} - ${dateFormatted}`;
  const slug = generateUniqueSlug(checkSlug);

  // Build beautiful HTML content with zodiac icons
  let content = "";
  for (let i = 0; i < signs.length; i++) {
    const s = signs[i];
    const iconUrl = getSignIconUrl(s.english);
    content += `<h3><img src="${iconUrl}" alt="${s.name}" style="display:inline-block;vertical-align:middle;width:36px;height:36px;margin-right:8px;" />${s.name} <small>(${s.dates})</small></h3>`;
    content += `<p>${s.text}</p>`;
    if (i < signs.length - 1) content += `<hr />`;
  }

  // Generate premium horoscope cover image via Cloudinary
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  let imageUrl = "";
  if (cloudName) {
    const titleText = encodeURIComponent("HOROSKOPI " + label.toUpperCase());
    const dateText = encodeURIComponent(dateFormatted);
    // Dark purple/navy gradient bg + large VBO logo + gold title + zodiac signs + date
    imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_1200,h_630,c_fill,b_rgb:080820/l_vipat-assets:vipat-watermark,w_200,o_90,g_center,y_-60/co_rgb:d4a843,l_text:Georgia_46_bold_letter_spacing_6:${titleText}/fl_layer_apply,g_center,y_80/co_rgb:ffffff50,l_text:Arial_20:${dateText}/fl_layer_apply,g_center,y_130/co_rgb:d4a84340,l_text:Georgia_30:%E2%99%88%20%E2%99%89%20%E2%99%8A%20%E2%99%8B%20%E2%99%8C%20%E2%99%8D%20%E2%99%8E%20%E2%99%8F%20%E2%99%90%20%E2%99%91%20%E2%99%92%20%E2%99%93/fl_layer_apply,g_south,y_25/co_rgb:d4a84330,l_text:Arial_12:vipatebllokut.com/fl_layer_apply,g_south_east,x_20,y_10/vipat-media/og-placeholder.png`;
  }

  const articleId = await insertArticle(title, slug, content, "", imageUrl, categoryId, today);
  if (articleId) {
    if (teGjithaId) {
      try { await db.insert(articleCategories).values({ articleId, categoryId: teGjithaId }); } catch {}
    }
    console.log(`[Horoscope] ✓ ${label}: ${signs.length} signs in 1 article`);
    return true;
  }

  return false;
}

/**
 * Scrape all horoscope types: daily (1 article), weekly (1 article), monthly (1 article).
 * Total: 3 articles max.
 */
export async function scrapeHoroscope(): Promise<number> {
  console.log("[Horoscope] Starting horoscope scrape...");
  let count = 0;
  if (await scrapeHoroscopeType("ditor")) count++;
  if (await scrapeHoroscopeType("javor")) count++;
  if (await scrapeHoroscopeType("mujor")) count++;
  console.log(`[Horoscope] Done: ${count} articles created.`);
  return count;
}

// ─── Database Wipe ──────────────────────────────────────────────────

/**
 * Wipes all articles and article-category links from the database.
 * Categories and users are preserved.
 */
export async function wipeArticles(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Wipe] Database not available.");
    return;
  }

  try {
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
    await db.execute(sql`TRUNCATE TABLE article_categories`);
    await db.execute(sql`TRUNCATE TABLE articles`);
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
    // Reset title cache so next import starts fresh
    recentTitlesCache = [];
    cacheLoadedAt = 0;
    console.log("[Wipe] Successfully wiped all articles.");
  } catch (error) {
    console.error("[Wipe] Failed to wipe articles:", error);
  }
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
