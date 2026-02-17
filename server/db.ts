import { eq, desc, and, or, like, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, articles, categories, articleCategories, InsertArticle, InsertCategory, InsertArticleCategory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

export async function getPublishedArticles(limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .offset(offset);
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

// Category queries
export async function createCategory(category: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(categories).values(category);
}

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(categories).orderBy(categories.name);
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
