/**
 * Automated News Scraper for Albanian News Sites
 *
 * Sources:
 *   - JOQ Albania (joq-albania.com)
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
const BLOCKED_WORDS = ["rraja", "capaj"];

function containsBlockedWord(text: string): string | null {
  const lower = text.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) return word;
  }
  return null;
}

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

// ─── JOQ Category Page Scraper ───────────────────────────────────────

// All JOQ category pages to scrape (~100 articles each, all pre-loaded in HTML)
const JOQ_CATEGORY_PAGES = [
  "lajme",
  "sport",
  "bota",
  "teknologji",
  "argetim",
  "shendeti",
  "kuriozitete",
  "thashetheme",
  "udhetime",
  "sondazhe",
  "vec-e-jona",
  "si-te",
];

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

/**
 * Scrape a single JOQ category page for all article links.
 * Each page has ~100 articles pre-loaded (the "Më shumë" button is just CSS).
 */
async function scrapeJoqCategoryPage(categorySlug: string): Promise<JoqArticleLink[]> {
  const url = `${JOQ_BASE_URL}/kategori/${categorySlug}.html`;
  console.log(`[Scraper] Fetching category page: ${categorySlug}`);

  const html = await fetchPage(url);
  if (!html) {
    console.log(`[Scraper] Failed to fetch category: ${categorySlug}`);
    return [];
  }

  const links: JoqArticleLink[] = [];

  // Extract article links - pattern: /artikull/{id}.html
  const regex = /\/artikull\/(\d+)\.html/g;
  const seen = new Set<string>();
  let match;
  while ((match = regex.exec(html)) !== null) {
    const fullUrl = JOQ_BASE_URL + match[0];
    if (seen.has(fullUrl)) continue;
    seen.add(fullUrl);

    links.push({
      url: fullUrl,
      title: "",  // Will be scraped from article page
      imageUrl: null,
      categorySlug: categorySlug,  // We know the category from the page
      pubDate: null,
    });
  }

  console.log(`[Scraper] Found ${links.length} articles in ${categorySlug}`);
  return links;
}

/**
 * Fetch articles from all JOQ category pages.
 * Deduplicates across categories (same article can appear in multiple).
 */
// Generic categories that should be overridden by more specific ones
const GENERIC_CATEGORIES = new Set(["lajme", "aktualitet", "kuriozitete", "vec-e-jona", "si-te"]);

async function fetchAllJoqArticles(): Promise<JoqArticleLink[]> {
  const linkMap = new Map<string, JoqArticleLink>();

  for (const categorySlug of JOQ_CATEGORY_PAGES) {
    const categoryLinks = await scrapeJoqCategoryPage(categorySlug);

    for (const link of categoryLinks) {
      const existing = linkMap.get(link.url);
      if (!existing) {
        linkMap.set(link.url, link);
      } else if (GENERIC_CATEGORIES.has(existing.categorySlug || "") && !GENERIC_CATEGORIES.has(categorySlug)) {
        // Replace generic category with more specific one
        existing.categorySlug = categorySlug;
      }
    }

    // Small delay between category pages
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const allLinks = Array.from(linkMap.values());

  // Also check the Kosova and Maqedoni sections (different URL pattern)
  for (const section of ["kosova", "maqedoni"]) {
    const url = `${JOQ_BASE_URL}/${section}/index.html`;
    console.log(`[Scraper] Fetching section: ${section}`);
    const html = await fetchPage(url);
    if (html) {
      const regex = /\/artikull\/(\d+)\.html/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const fullUrl = JOQ_BASE_URL + match[0];
        if (linkMap.has(fullUrl)) continue;
        linkMap.set(fullUrl, {
          url: fullUrl,
          title: "",
          imageUrl: null,
          categorySlug: section,
          pubDate: null,
        });
      }
      console.log(`[Scraper] Found articles in ${section}`);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return allLinks;
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
async function scrapeMediadeskCategoryPage(site: MediadeskSite, categorySlug: string): Promise<JoqArticleLink[]> {
  const url = `${site.baseUrl}/category/${categorySlug}`;
  console.log(`[${site.name}] Fetching category: ${categorySlug}`);

  const html = await fetchPage(url);
  if (!html) {
    console.log(`[${site.name}] Failed to fetch category: ${categorySlug}`);
    return [];
  }

  const links: JoqArticleLink[] = [];
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
async function fetchAllMediadeskArticles(site: MediadeskSite): Promise<JoqArticleLink[]> {
  const linkMap = new Map<string, JoqArticleLink>();

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

  // 3. Extract content — Mediadesk uses content-col or layout-form_article-body
  let content = "";
  const contentPatterns = [
    /<div[^>]*class="[^"]*content-col[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class="[^"]*(?:related|share|social|writer|suggested)[^"]*")/i,
    /<div[^>]*class="[^"]*content-col[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*layout-form_article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
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

  // Fallback: all paragraphs
  if (content.length < 100) {
    const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    const text = paragraphs
      .map(p => stripHtml(p))
      .filter(p => p.length > 30 && !isJunkText(p))
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
  const dateMatch = html.match(/Publikuar më\s*:?\s*(\d{1,2}[./]\d{1,2}[./]\d{4}[,\s]*\d{1,2}:\d{2})/i)
    || html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<time[^>]+datetime=["']([^"']+)["']/i)
    || html.match(/(\d{1,2}\.\d{1,2}\.\d{4},\s*\d{1,2}:\d{2})/);
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

// Source boilerplate that should be stripped at scrape time
const SOURCE_BOILERPLATE = [
  /versus\s+[eë]sht[eë]\s+nj[eë]\s+media/i,
  /vox\s*(?:news)?\s+[eë]sht[eë]\s+nj[eë]\s+media/i,
  /vox\s+[eë]sht[eë]\s+nj[eë]\s+media/i,
  /joq\s+[eë]sht[eë]/i,
  /d[eë]rgoni\s+informacion/i,
  /m[eë]nyr[eë]\s+anonime/i,
  /raportimi\s+i\s+paansh[eë]m/i,
  /ne\s+q[eë]ndrojm[eë]\s+p[eë]rball[eë]/i,
  /drejtor\s+i\s+p[eë]rgjithsh[eë]m\s*:/i,
  /blerina\s*spaho/i,
  /\+355\s*\d/i,
  /shkruar\s*nga\s*redaksia/i,
  /redaksia\s+(?:vox|versus|joq)/i,
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
    .replace(/<!--[\s\S]*?-->/g, "");

  const paragraphs = cleaned.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  const text = paragraphs
    .map(p => stripHtml(p))
    .filter(p => p.length >= 20 && !isJunkText(p) && !isSourceBoilerplate(p))
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
  { name: "Aktualitet", slug: "aktualitet", description: "Lajme aktuale nga Shqipëria" },
  { name: "Politikë", slug: "politike", description: "Lajme politike" },
  { name: "Sport", slug: "sport", description: "Lajme sportive" },
  { name: "Botë", slug: "bote", description: "Lajme ndërkombëtare" },
  { name: "Ekonomi", slug: "ekonomi", description: "Lajme ekonomike" },
  { name: "Teknologji", slug: "teknologji", description: "Lajme teknologjike" },
  { name: "Kulturë", slug: "kulture", description: "Art, muzikë dhe kulturë" },
  { name: "Shëndetësi", slug: "shendetesi", description: "Lajme shëndetësore" },
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
    if (titleSimilarity(title, existingTitle) >= 0.70) {
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

const ALBANIAN_MONTHS: Record<string, number> = {
  janar: 0, shkurt: 1, mars: 2, prill: 3, maj: 4, qershor: 5,
  korrik: 6, gusht: 7, shtator: 8, tetor: 9, nentor: 10, nëntor: 10, dhjetor: 11,
};

function parseArticleDate(dateStr: string): Date {
  // Try ISO format first (JSON-LD: "2026-03-22T15:25:00+01:00")
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime()) && dateStr.includes("T")) return isoDate;

  // Try dd.mm.yyyy, HH:MM format (JOQ: "22.03.2026, 18:00")
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
const parseJoqDate = parseArticleDate;

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

  const result: ImportResult = {
    totalFetched: 0,
    newArticles: 0,
    duplicatesSkipped: 0,
    skippedNoImage: 0,
    skippedNoContent: 0,
    errors: 0,
    sources: ["JOQ Albania", "VoxNews", "Versus"],
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

  // Step 1: Fetch articles from ALL sources
  const joqLinks = await fetchAllJoqArticles();
  console.log(`[Scraper] JOQ: ${joqLinks.length} articles`);

  // Tag JOQ links with source
  for (const link of joqLinks) (link as any)._source = "joq";

  const allMediadeskLinks: JoqArticleLink[] = [];
  for (const site of MEDIADESK_SITES) {
    try {
      const siteLinks = await fetchAllMediadeskArticles(site);
      for (const link of siteLinks) (link as any)._source = site.name.toLowerCase();
      allMediadeskLinks.push(...siteLinks);
      console.log(`[Scraper] ${site.name}: ${siteLinks.length} articles`);
    } catch (e) {
      console.error(`[Scraper] ${site.name} failed:`, e);
      result.errors++;
    }
  }

  // Merge all sources
  const articleLinks = [...joqLinks, ...allMediadeskLinks];
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
  // JOQ: /artikull/{id}.html, Mediadesk: /{cat}/{slug}-i{id}
  articleLinks.sort((a, b) => {
    const idA = parseInt(a.url.match(/(?:\/artikull\/(\d+)\.html|-i(\d+)$)/)?.[1] || a.url.match(/-i(\d+)$/)?.[1] || "0");
    const idB = parseInt(b.url.match(/(?:\/artikull\/(\d+)\.html|-i(\d+)$)/)?.[1] || b.url.match(/-i(\d+)$/)?.[1] || "0");
    return idB - idA;
  });

  // Shuffle to mix sources (prevents one source dominating all 50 slots)
  // Strategy: interleave sources so we get ~17 from each
  const bySource = new Map<string, JoqArticleLink[]>();
  for (const link of articleLinks) {
    const src = (link as any)._source || "joq";
    if (!bySource.has(src)) bySource.set(src, []);
    bySource.get(src)!.push(link);
  }
  const interleaved: JoqArticleLink[] = [];
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
  const MAX_CONSECUTIVE_DUPES = 15;

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

      // Scrape article content using the right parser per source
      const source = (link as any)._source || "joq";
      const scraped = source === "joq"
        ? scrapeJoqArticlePage(articleHtml)
        : scrapeMediadeskArticlePage(articleHtml, source);
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

      // Determine category: source mapping → keyword detection → default
      let categorySlug = "aktualitet";
      const sourceCat = link.categorySlug || scraped.category;
      // Build combined category map from all sources
      let mappedCat: string | null = null;
      if (sourceCat) {
        if (source === "joq") {
          mappedCat = JOQ_CATEGORY_MAP[sourceCat] || null;
        } else {
          // Find the Mediadesk site config for this source
          const siteConfig = MEDIADESK_SITES.find(s => s.name.toLowerCase() === source);
          mappedCat = siteConfig?.categoryMap[sourceCat] || null;
        }
      }
      if (mappedCat && mappedCat !== "aktualitet") {
        categorySlug = mappedCat;
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
