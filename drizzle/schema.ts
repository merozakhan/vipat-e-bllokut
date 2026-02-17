import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, index, unique } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Categories for organizing articles
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * News articles table
 */
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: varchar("featuredImage", { length: 500 }),
  featuredImageKey: varchar("featuredImageKey", { length: 500 }),
  status: mysqlEnum("status", ["draft", "published"]).default("published").notNull(),
  authorId: int("authorId").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  authorIdx: index("author_idx").on(table.authorId),
  statusIdx: index("status_idx").on(table.status),
  publishedAtIdx: index("published_at_idx").on(table.publishedAt),
  slugIdx: index("slug_idx").on(table.slug),
}));

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Many-to-many relationship between articles and categories
 */
export const articleCategories = mysqlTable("article_categories", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  categoryId: int("categoryId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  articleIdx: index("article_idx").on(table.articleId),
  categoryIdx: index("category_idx").on(table.categoryId),
  uniquePair: unique("unique_article_category").on(table.articleId, table.categoryId),
}));

export type ArticleCategory = typeof articleCategories.$inferSelect;
export type InsertArticleCategory = typeof articleCategories.$inferInsert;
