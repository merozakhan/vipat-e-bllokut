import { eq, desc, asc, and, or, like, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, articles, categories, articleCategories, pageViews, InsertArticle, InsertCategory, InsertArticleCategory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Simple in-memory cache
const cache = new Map<string, { data: unknown; expiresAt: number }>();
function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) { cache.delete(key); return undefined; }
  return entry.data as T;
}
function setCache(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Article queries
export async function createArticle(article: InsertArticle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(articles).values(article);
  return result;
}

export async function getArticleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getArticleWithCategories(where: { slug?: string; id?: number }) {
  const db = await getDb();
  if (!db) return null;

  const condition = where.slug ? eq(articles.slug, where.slug) : eq(articles.id, where.id!);
  const result = await db.select().from(articles).where(condition).limit(1);
  if (result.length === 0) return null;

  const article = result[0];
  const cats = await db
    .select({ category: categories })
    .from(articleCategories)
    .leftJoin(categories, eq(articleCategories.categoryId, categories.id))
    .where(eq(articleCategories.articleId, article.id));

  return { ...article, categories: cats.map(r => r.category).filter(Boolean) };
}

export async function getPublishedArticles(limit: number = 20, offset: number = 0) {
  const cacheKey = `published:${limit}:${offset}`;
  const cached = getCached<Awaited<ReturnType<typeof getAllArticles>>>(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .offset(offset);

  setCache(cacheKey, result, 60 * 1000); // 1 min TTL
  return result;
}

export async function getAllArticles(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(articles)
    .orderBy(desc(articles.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateArticle(id: number, data: Partial<InsertArticle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(articles).set(data).where(eq(articles.id, id));
}

export async function deleteArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete article-category relationships first
  await db.delete(articleCategories).where(eq(articleCategories.articleId, id));
  // Delete article
  return await db.delete(articles).where(eq(articles.id, id));
}

export async function clearAllArticles() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(articleCategories);
  await db.delete(articles);
}

export async function getArticlesByPlacement(placement: string, limit: number = 10) {
  const cacheKey = `placement:${placement}:${limit}`;
  const cached = getCached<Awaited<ReturnType<typeof getAllArticles>>>(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(articles)
    .where(and(
      eq(articles.status, "published"),
      eq(articles.homepagePlacement, placement as any),
    ))
    .orderBy(asc(articles.homepagePosition), desc(articles.publishedAt))
    .limit(limit);

  setCache(cacheKey, result, 2 * 60 * 1000); // 2 min cache
  return result;
}

export async function searchArticles(query: string, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        or(
          like(articles.title, `%${query}%`),
          like(articles.content, `%${query}%`),
          like(articles.excerpt, `%${query}%`)
        )
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function getArticlesByCategory(categoryId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  const articleIds = await db
    .select({ articleId: articleCategories.articleId })
    .from(articleCategories)
    .where(eq(articleCategories.categoryId, categoryId));

  if (articleIds.length === 0) return [];

  return await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        inArray(articles.id, articleIds.map(a => a.articleId))
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .offset(offset);
}

// ─── View Tracking ──────────────────────────────────────────────────

export async function incrementViews(articleId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(articles).set({ views: sql`views + 1` }).where(eq(articles.id, articleId));
}

// ─── Trending/Engagement Scoring ────────────────────────────────────

// Scandal & controversy keywords (+3 each - heaviest weight)
const SCANDAL_KEYWORDS = [
  "skandal", "arrest", "akuz", "vrasj", "vdekj", "korrupsion",
  "tradhti", "krim", "drog\u00EB", "mashtrim", "grabitj", "p\u00EBrdhun",
  "d\u00EBnoj", "burg", "hetim", "spak", "prokurori", "gjyq",
  "vjedhj", "mashtr", "afer", "abuzim", "shkel", "fsheh",
  "p\u00EBrgjim", "prangos", "ekzekut", "rr\u00EBmbe", "pengmarrj",
  "trafikim", "prostitucion", "pedofil", "dhun\u00EB", "thik", "arm\u00EB",
  "plagos", "vrau", "vrar", "ekstradi", "arratis", "ikje",
  "p\u00EBrplas", "gjakder", "masakr", "torturo", "k\u00EBrcej",
];

// Conflict & crisis keywords (+3 each)
const CRISIS_KEYWORDS = [
  "luft\u00EB", "sulm", "bomb", "terrorist", "t\u00EBrmeti", "p\u00EBrmbytj",
  "urgjent", "alarm", "kriz\u00EB", "shp\u00EBrthim", "zjarr",
  "protest\u00EB", "grev\u00EB", "demonstrat", "rebelim", "kaos",
  "tensione", "incident", "aksident", "tragjedi", "fatkeq\u00EBsi",
  "emergjenc\u00EB", "evakuim", "rr\u00EBzim", "shembje", "p\u00EBrplasj",
];

// Political figures (+2 each)
const POLITICAL_FIGURES = [
  "trump", "putin", "zelensky", "macron", "biden",
  "rama", "berisha", "basha", "meta", "veliaj",
  "kurti", "osmani", "tha\u00E7i", "vu\u00E7i\u00E7", "erdogan",
  "von der leyen", "netanyahu", "kim jong",
];

// Power & money keywords (+2 each)
const POWER_KEYWORDS = [
  "milion", "miliard", "pasuri", "oligark", "sekret",
  "ndaloj", "largoj", "dor\u00EBheq", "shkarkoj", "pusht",
  "monopol", "tender\u00EB", "ryshfet", "para", "lek\u00EB",
  "ekskluzive", "zbuloj", "zbulohet", "prapasken",
  "konfidencial", "dokument", "d\u00EBshmi", "prova",
];

export function calculateEngagementScore(title: string, excerpt: string | null, views: number = 0, publishedAt: Date | string | null = null): number {
  const text = (title + ' ' + (excerpt || '')).toLowerCase();
  let score = 0;

  for (const kw of SCANDAL_KEYWORDS) { if (text.includes(kw)) score += 3; }
  for (const kw of CRISIS_KEYWORDS) { if (text.includes(kw)) score += 3; }
  for (const kw of POLITICAL_FIGURES) { if (text.includes(kw)) score += 2; }
  for (const kw of POWER_KEYWORDS) { if (text.includes(kw)) score += 2; }

  // Punctuation boosts
  if (title.includes('?')) score += 4;   // Curiosity gap
  if (title.includes('!')) score += 3;   // Urgency
  if (/[""\u201C\u201D]/.test(title)) score += 3;  // Quotes = controversy
  if (title.includes(':')) score += 1;   // Attribution
  if (/^[A-Z\u00CB\u00C7\u00DC]{3,}/.test(title)) score += 2;  // ALL CAPS start

  // Views: every 10 views = +1 (real engagement signal)
  score += Math.floor(views / 10);

  // Time decay: newer articles get massive boost, older ones fade
  if (publishedAt) {
    const pubDate = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
    const hoursAgo = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 3) score += 20;
    else if (hoursAgo < 6) score += 15;
    else if (hoursAgo < 12) score += 10;
    else if (hoursAgo < 24) score += 6;
    else if (hoursAgo < 48) score += 3;
    else if (hoursAgo < 72) score += 1;
  }

  return score;
}

export async function getTrendingArticles(limit: number = 10) {
  const cacheKey = `trending:${limit}`;
  const cached = getCached<Awaited<ReturnType<typeof getPublishedArticles>>>(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return [];

  const allRecent = await db
    .select()
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(50);

  // Score with time decay + views + keywords
  const scored = allRecent.map(article => ({
    ...article,
    engagementScore: calculateEngagementScore(article.title, article.excerpt, article.views ?? 0, article.publishedAt),
  }));

  scored.sort((a, b) => b.engagementScore - a.engagementScore);

  // Category mixing: max half of trending from same category
  const topCandidates = scored.slice(0, 50);
  const result: typeof topCandidates = [];
  const categoryCounts: Record<number, number> = {};
  const MAX_PER_CAT = Math.ceil(limit / 2);

  // Batch fetch categories for all candidates in ONE query (instead of N+1)
  const candidateIds = topCandidates.map(a => a.id);
  const catMap = new Map<number, number>();
  if (candidateIds.length > 0) {
    const allCats = await db
      .select({ articleId: articleCategories.articleId, categoryId: articleCategories.categoryId })
      .from(articleCategories)
      .where(inArray(articleCategories.articleId, candidateIds));
    for (const row of allCats) {
      if (!catMap.has(row.articleId)) {
        catMap.set(row.articleId, row.categoryId);
      }
    }
  }
  for (const a of topCandidates) {
    if (!catMap.has(a.id)) catMap.set(a.id, -1);
  }

  for (const article of topCandidates) {
    if (result.length >= limit) break;
    const catId = catMap.get(article.id) ?? -1;
    const count = categoryCounts[catId] || 0;
    if (count >= MAX_PER_CAT) continue;
    result.push(article);
    categoryCounts[catId] = count + 1;
  }

  // Fill remaining if needed
  for (const article of topCandidates) {
    if (result.length >= limit) break;
    if (!result.find(r => r.id === article.id)) result.push(article);
  }

  // Cache trending results for 2 minutes
  setCache(cacheKey, result, 2 * 60 * 1000);
  return result;
}

export async function getArticlesByCategorySlug(slug: string, limit: number = 10, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  const cat = await getCategoryBySlug(slug);
  if (!cat) return [];

  return await getArticlesByCategory(cat.id, limit, offset);
}

// Category queries
export async function createCategory(category: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(categories).values(category);
}

type CategoryRow = typeof categories.$inferSelect;
type CategoryWithCount = CategoryRow & { articleCount: number };

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const cached = getCached<CategoryWithCount[]>('categoriesWithCounts');
  if (cached) return cached;

  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      articleCount: sql<number>`(SELECT COUNT(*) FROM article_categories WHERE article_categories.categoryId = ${categories.id})`,
    })
    .from(categories)
    .orderBy(categories.name);

  setCache('categoriesWithCounts', result, 10 * 60 * 1000);
  return result;
}

export async function getAllCategories(): Promise<CategoryRow[]> {
  const cached = getCached<CategoryRow[]>('allCategories');
  if (cached) return cached;

  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(categories).orderBy(categories.name);
  setCache('allCategories', result, 10 * 60 * 1000); // 10 min TTL
  return result;
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete article-category relationships first
  await db.delete(articleCategories).where(eq(articleCategories.categoryId, id));
  // Delete category
  return await db.delete(categories).where(eq(categories.id, id));
}

// Article-Category relationship queries
export async function addArticleToCategory(articleId: number, categoryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(articleCategories).values({ articleId, categoryId });
}

export async function removeArticleFromCategory(articleId: number, categoryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(articleCategories)
    .where(
      and(
        eq(articleCategories.articleId, articleId),
        eq(articleCategories.categoryId, categoryId)
      )
    );
}

export async function getArticleCategories(articleId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({ category: categories })
    .from(articleCategories)
    .leftJoin(categories, eq(articleCategories.categoryId, categories.id))
    .where(eq(articleCategories.articleId, articleId));

  return result.map(r => r.category).filter(Boolean);
}

export async function setArticleCategories(articleId: number, categoryIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Remove all existing categories
  await db.delete(articleCategories).where(eq(articleCategories.articleId, articleId));

  // Add new categories
  if (categoryIds.length > 0) {
    await db.insert(articleCategories).values(
      categoryIds.map(categoryId => ({ articleId, categoryId }))
    );
  }
}

// ─── Page View Analytics ────────────────────────────────────────────

let pageViewsTableReady = false;

async function ensurePageViewsTable(): Promise<void> {
  if (pageViewsTableReady) return;
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS page_views (
      id int AUTO_INCREMENT PRIMARY KEY,
      path varchar(500) NOT NULL,
      date varchar(10) NOT NULL,
      count int NOT NULL DEFAULT 0,
      UNIQUE KEY unique_path_date (path, date),
      KEY date_idx (date)
    )`);
    pageViewsTableReady = true;
  } catch {
    // Table might already exist or DB might not support it
    pageViewsTableReady = true;
  }
}

export async function trackPageView(path: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await ensurePageViewsTable();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  try {
    await db.insert(pageViews).values({ path, date: today, count: 1 })
      .onDuplicateKeyUpdate({ set: { count: sql`count + 1` } });
  } catch (e) {
    // Silently fail — analytics should never break the app
  }
}

export async function getAnalyticsStats(): Promise<{
  today: number;
  yesterday: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  dailyBreakdown: { date: string; views: number }[];
}> {
  const db = await getDb();
  if (!db) return { today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0, allTime: 0, dailyBreakdown: [] };

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoStr = monthAgo.toISOString().split("T")[0];

  const [todayResult] = await db.select({ total: sql<number>`COALESCE(SUM(count), 0)` })
    .from(pageViews).where(eq(pageViews.date, todayStr));
  const [yesterdayResult] = await db.select({ total: sql<number>`COALESCE(SUM(count), 0)` })
    .from(pageViews).where(eq(pageViews.date, yesterdayStr));
  const [weekResult] = await db.select({ total: sql<number>`COALESCE(SUM(count), 0)` })
    .from(pageViews).where(sql`${pageViews.date} >= ${weekAgoStr}`);
  const [monthResult] = await db.select({ total: sql<number>`COALESCE(SUM(count), 0)` })
    .from(pageViews).where(sql`${pageViews.date} >= ${monthAgoStr}`);
  const [allTimeResult] = await db.select({ total: sql<number>`COALESCE(SUM(count), 0)` })
    .from(pageViews);

  // Daily breakdown for last 30 days
  const dailyBreakdown = await db
    .select({ date: pageViews.date, views: sql<number>`SUM(count)` })
    .from(pageViews)
    .where(sql`${pageViews.date} >= ${monthAgoStr}`)
    .groupBy(pageViews.date)
    .orderBy(desc(pageViews.date));

  return {
    today: todayResult?.total ?? 0,
    yesterday: yesterdayResult?.total ?? 0,
    thisWeek: weekResult?.total ?? 0,
    thisMonth: monthResult?.total ?? 0,
    allTime: allTimeResult?.total ?? 0,
    dailyBreakdown: dailyBreakdown.map(d => ({ date: d.date, views: d.views })),
  };
}

export async function getArticleStats(): Promise<{
  total: number;
  published: number;
  draft: number;
  totalViews: number;
}> {
  const db = await getDb();
  if (!db) return { total: 0, published: 0, draft: 0, totalViews: 0 };

  const [totalResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(articles);
  const [publishedResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(articles).where(eq(articles.status, "published"));
  const [draftResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(articles).where(eq(articles.status, "draft"));
  const [viewsResult] = await db.select({ total: sql<number>`COALESCE(SUM(views), 0)` }).from(articles);

  return {
    total: totalResult?.count ?? 0,
    published: publishedResult?.count ?? 0,
    draft: draftResult?.count ?? 0,
    totalViews: viewsResult?.total ?? 0,
  };
}

export async function getTopArticlesByViews(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.views))
    .limit(limit);
}
