import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createArticle,
  getArticleById,
  getArticleBySlug,
  getPublishedArticles,
  getAllArticles,
  updateArticle,
  deleteArticle,
  searchArticles,
  getArticlesByCategory,
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  setArticleCategories,
  getArticleCategories,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { getLastImportResult, isImportRunning, triggerManualImport } from "./cronScheduler";

// Helper function to generate URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  articles: router({
    // Get published articles for public display
    getPublished: publicProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return await getPublishedArticles(input.limit, input.offset);
      }),

    // Get featured article (most recent published)
    getFeatured: publicProcedure.query(async () => {
      const articles = await getPublishedArticles(1, 0);
      return articles.length > 0 ? articles[0] : null;
    }),

    // Get all articles (for admin/AI agent)
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
        
        // Get categories for this article
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

    // Create article (AI publishing endpoint)
    create: publicProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        excerpt: z.string().optional(),
        featuredImageUrl: z.string().optional(),
        categoryIds: z.array(z.number()).optional(),
        status: z.enum(["draft", "published"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Generate slug from title
        const baseSlug = generateSlug(input.title);
        let slug = baseSlug;
        let counter = 1;
        
        // Ensure unique slug
        while (await getArticleBySlug(slug)) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Get author ID (use authenticated user or default to 1 for AI agent)
        const authorId = ctx.user?.id || 1;

        const result = await createArticle({
          title: input.title,
          slug,
          content: input.content,
          excerpt: input.excerpt || input.content.substring(0, 200) + "...",
          featuredImage: input.featuredImageUrl,
          status: input.status || "published",
          authorId,
          publishedAt: input.status === "published" ? new Date() : null,
        });

        // Get the created article to return its ID
        const article = await getArticleBySlug(slug);
        const articleId = article!.id;

        // Set categories if provided
        if (input.categoryIds && input.categoryIds.length > 0) {
          await setArticleCategories(articleId, input.categoryIds);
        }

        return { success: true, articleId, slug };
      }),

    // Update article
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        featuredImageUrl: z.string().optional(),
        categoryIds: z.array(z.number()).optional(),
        status: z.enum(["draft", "published"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const updateData: any = {};
        
        if (input.title) {
          updateData.title = input.title;
          updateData.slug = generateSlug(input.title);
        }
        if (input.content) updateData.content = input.content;
        if (input.excerpt) updateData.excerpt = input.excerpt;
        if (input.featuredImageUrl) updateData.featuredImage = input.featuredImageUrl;
        if (input.status) {
          updateData.status = input.status;
          if (input.status === "published") {
            updateData.publishedAt = new Date();
          }
        }

        await updateArticle(input.id, updateData);

        if (input.categoryIds) {
          await setArticleCategories(input.id, input.categoryIds);
        }

        return { success: true };
      }),

    // Delete article
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteArticle(input.id);
        return { success: true };
      }),

    // Upload image for article
    uploadImage: publicProcedure
      .input(z.object({
        imageData: z.string(), // Base64 encoded image
        filename: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Convert base64 to buffer
        const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Generate unique filename
        const fileKey = `articles/${nanoid()}-${input.filename}`;

        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        return { url, fileKey };
      }),
  }),

  categories: router({
    // Get all categories
    getAll: publicProcedure.query(async () => {
      return await getAllCategories();
    }),

    // Get category by slug
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await getCategoryBySlug(input.slug);
      }),

    // Get category by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getCategoryById(input.id);
      }),

    // Create category
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const slug = generateSlug(input.name);

        await createCategory({
          name: input.name,
          slug,
          description: input.description,
        });

        return { success: true, slug };
      }),

    // Update category
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const updateData: any = {};
        
        if (input.name) {
          updateData.name = input.name;
          updateData.slug = generateSlug(input.name);
        }
        if (input.description !== undefined) updateData.description = input.description;

        await updateCategory(input.id, updateData);
        return { success: true };
      }),

    // Delete category
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCategory(input.id);
        return { success: true };
      }),
  }),

  // RSS Import status and controls
  rssImport: router({
    // Get last import status
    status: publicProcedure.query(() => {
      return {
        lastResult: getLastImportResult(),
        isRunning: isImportRunning(),
      };
    }),

    // Manually trigger an import
    trigger: publicProcedure.mutation(async () => {
      const result = await triggerManualImport();
      return { success: !!result, result };
    }),
  }),
});

export type AppRouter = typeof appRouter;
