import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getArticleById,
  getArticleBySlug,
  getPublishedArticles,
  getAllArticles,
  searchArticles,
  getArticlesByCategory,
  getArticlesByCategorySlug,
  getTrendingArticles,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  getArticleCategories,
} from "./db";
import { getLastImportResult, isImportRunning, triggerManualImport } from "./cronScheduler";

export const appRouter = router({
  system: systemRouter,

  articles: router({
    // Get published articles for public display
    getPublished: publicProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return await getPublishedArticles(input.limit, input.offset);
      }),

    // Get featured article (most controversial recent article)
    getFeatured: publicProcedure.query(async () => {
      const trending = await getTrendingArticles(1);
      return trending.length > 0 ? trending[0] : null;
    }),

    // Get trending/controversial articles
    getTrending: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await getTrendingArticles(input.limit || 10);
      }),

    // Get articles by category slug
    getByCategorySlug: publicProcedure
      .input(z.object({ slug: z.string(), limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return await getArticlesByCategorySlug(input.slug, input.limit, input.offset);
      }),

    // Get all articles
    getAll: publicProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return await getAllArticles(input.limit, input.offset);
      }),

    // Get single article by slug
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const article = await getArticleBySlug(input.slug);
        if (!article) return null;
        
        const categories = await getArticleCategories(article.id);
        return { ...article, categories };
      }),

    // Get single article by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const article = await getArticleById(input.id);
        if (!article) return null;
        
        const categories = await getArticleCategories(article.id);
        return { ...article, categories };
      }),

    // Search articles
    search: publicProcedure
      .input(z.object({ query: z.string(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await searchArticles(input.query, input.limit);
      }),

    // Get articles by category
    getByCategory: publicProcedure
      .input(z.object({ categoryId: z.number(), limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return await getArticlesByCategory(input.categoryId, input.limit, input.offset);
      }),
  }),

  categories: router({
    getAll: publicProcedure.query(async () => {
      return await getAllCategories();
    }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await getCategoryBySlug(input.slug);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getCategoryById(input.id);
      }),
  }),

  // RSS Import status and controls
  rssImport: router({
    status: publicProcedure.query(() => {
      return {
        lastResult: getLastImportResult(),
        isRunning: isImportRunning(),
      };
    }),

    trigger: publicProcedure.mutation(async () => {
      const result = await triggerManualImport();
      return { success: !!result, result };
    }),
  }),
});

export type AppRouter = typeof appRouter;
