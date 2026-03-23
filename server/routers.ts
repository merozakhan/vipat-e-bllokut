import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ENV } from "./_core/env";
import {
  getPublishedArticles,
  getAllArticles,
  searchArticles,
  getArticlesByCategory,
  getArticlesByCategorySlug,
  getTrendingArticles,
  getAllCategories,
  getCategoriesWithCounts,
  getCategoryById,
  getCategoryBySlug,
  getArticleWithCategories,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  clearAllArticles,
  setArticleCategories,
  getArticleCategories,
  getArticleBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  incrementViews,
  upsertUser,
  getUserByOpenId,
  getAnalyticsStats,
  getArticleStats,
  getTopArticlesByViews,
  trackPageView,
} from "./db";
import { uploadImageBase64, uploadMediaBase64, listMedia, deleteMedia } from "./cloudinaryStorage";
import { getLastImportResult, isImportRunning, triggerManualImport } from "./cronScheduler";
import { getBlockedWords, setBlockedWords } from "./rssImporter";
import { rewriteArticle } from "./rewriter";
import { sendContactEmail, sendNewsletterConfirmation } from "./emailService";

export const appRouter = router({
  system: systemRouter,

  articles: router({
    getPublished: publicProcedure
      .input(z.object({ limit: z.number().max(100).optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return await getPublishedArticles(input.limit, input.offset);
      }),

    getFeatured: publicProcedure.query(async () => {
      const trending = await getTrendingArticles(1);
      return trending.length > 0 ? trending[0] : null;
    }),

    getTrending: publicProcedure
      .input(z.object({ limit: z.number().max(50).optional() }))
      .query(async ({ input }) => {
        return await getTrendingArticles(input.limit || 10);
      }),

    getByCategorySlug: publicProcedure
      .input(z.object({ slug: z.string(), limit: z.number().max(100).optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return await getArticlesByCategorySlug(input.slug, input.limit, input.offset);
      }),

    getAll: publicProcedure
      .input(z.object({ limit: z.number().max(100).optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return await getAllArticles(input.limit, input.offset);
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await getArticleWithCategories({ slug: input.slug });
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getArticleWithCategories({ id: input.id });
      }),

    trackView: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await incrementViews(input.id);
        return { success: true };
      }),

    search: publicProcedure
      .input(z.object({ query: z.string(), limit: z.number().max(50).optional() }))
      .query(async ({ input }) => {
        return await searchArticles(input.query, input.limit);
      }),

    getByCategory: publicProcedure
      .input(z.object({ categoryId: z.number(), limit: z.number().max(100).optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        return await getArticlesByCategory(input.categoryId, input.limit, input.offset);
      }),
  }),

  categories: router({
    getAll: publicProcedure.query(async () => {
      return await getAllCategories();
    }),

    getAllWithCounts: publicProcedure.query(async () => {
      return await getCategoriesWithCounts();
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

  contact: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        company: z.string().optional(),
        reason: z.string().min(1),
        subject: z.string().optional(),
        message: z.string().min(1),
        budget: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await sendContactEmail(input);
        if (!result.success) {
          throw new Error(result.error || "Failed to send message");
        }
        return { success: true };
      }),

    newsletter: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const result = await sendNewsletterConfirmation(input);
        return { success: result.success };
      }),
  }),

  rssImport: router({
    status: publicProcedure.query(() => {
      return {
        lastResult: getLastImportResult(),
        isRunning: isImportRunning(),
      };
    }),

    trigger: adminProcedure.mutation(async () => {
      const result = await triggerManualImport();
      return { success: !!result, result };
    }),
  }),

  // ─── Admin Panel ────────────────────────────────────────────────────

  admin: router({
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (input.password !== ENV.adminPassword) {
          throw new Error("Invalid password");
        }

        // Upsert admin user
        const adminOpenId = "admin-local";
        await upsertUser({
          openId: adminOpenId,
          name: "Admin",
          role: "admin",
          lastSignedIn: new Date(),
        });

        // Issue JWT cookie
        const token = jwt.sign({ openId: adminOpenId }, ENV.cookieSecret, { expiresIn: "7d" });
        ctx.res.cookie(COOKIE_NAME, token, {
          httpOnly: true,
          secure: ENV.isProduction,
          sameSite: "lax",
          maxAge: ONE_YEAR_MS,
          path: "/",
        });

        return { success: true };
      }),

    me: publicProcedure.query(({ ctx }) => {
      if (!ctx.user || ctx.user.role !== "admin") return null;
      return { id: ctx.user.id, name: ctx.user.name, role: ctx.user.role };
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { path: "/" });
      return { success: true };
    }),

    // Article CRUD
    articlesList: adminProcedure
      .input(z.object({ limit: z.number().max(100).optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        const arts = await getAllArticles(input.limit || 50, input.offset || 0);
        // Attach categories to each article
        const result = await Promise.all(arts.map(async (a) => {
          const cats = await getArticleCategories(a.id);
          return { ...a, categories: cats };
        }));
        return result;
      }),

    articlesGetById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getArticleWithCategories({ id: input.id });
      }),

    articlesCreate: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        excerpt: z.string().optional(),
        featuredImage: z.string().optional(),
        status: z.enum(["draft", "published"]).optional(),
        homepagePlacement: z.enum(["breaking", "trending", "hot", "most_read"]).nullable().optional(),
        homepagePosition: z.number().min(1).max(5).nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const status = input.status || "published";
        // Generate slug
        const baseSlug = input.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim()
          .substring(0, 200);
        let slug = baseSlug || "article";
        let counter = 1;
        while (await getArticleBySlug(slug)) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        await createArticle({
          title: input.title,
          slug,
          content: input.content,
          excerpt: input.excerpt || input.content.replace(/<[^>]*>/g, "").substring(0, 300) + "...",
          featuredImage: input.featuredImage || null,
          status,
          authorId: ctx.user.id,
          publishedAt: status === "published" ? new Date() : null,
          homepagePlacement: input.homepagePlacement || null,
          homepagePosition: input.homepagePosition || null,
        });

        const article = await getArticleBySlug(slug);
        if (article) {
          // Auto-assign to "Të Gjitha" category
          const teGjitha = await getCategoryBySlug("te-gjitha");
          if (teGjitha) {
            await setArticleCategories(article.id, [teGjitha.id]);
          }
        }

        return { success: true, slug, id: article?.id };
      }),

    articlesUpdate: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        excerpt: z.string().optional(),
        featuredImage: z.string().nullable().optional(),
        status: z.enum(["draft", "published"]).optional(),
        homepagePlacement: z.enum(["breaking", "trending", "hot", "most_read"]).nullable().optional(),
        homepagePosition: z.number().min(1).max(5).nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateArticle(id, data as any);
        return { success: true };
      }),

    articlesDelete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteArticle(input.id);
        return { success: true };
      }),

    articlesClearAll: adminProcedure
      .mutation(async () => {
        await clearAllArticles();
        return { success: true };
      }),

    uploadImage: adminProcedure
      .input(z.object({ base64: z.string(), filename: z.string() }))
      .mutation(async ({ input }) => {
        const url = await uploadImageBase64(input.base64, input.filename);
        if (!url) throw new Error("Image upload failed");
        return { url };
      }),

    // Analytics
    analyticsStats: adminProcedure.query(async () => {
      return await getAnalyticsStats();
    }),

    articleStats: adminProcedure.query(async () => {
      return await getArticleStats();
    }),

    topArticles: adminProcedure
      .input(z.object({ limit: z.number().max(20).optional() }))
      .query(async ({ input }) => {
        return await getTopArticlesByViews(input.limit || 10);
      }),

    // Media Library
    mediaList: adminProcedure
      .input(z.object({ limit: z.number().max(200).optional(), cursor: z.string().optional() }))
      .query(async ({ input }) => {
        return await listMedia(input.limit || 100, input.cursor);
      }),

    mediaUpload: adminProcedure
      .input(z.object({
        base64: z.string(),
        filename: z.string(),
        type: z.enum(["image", "video"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await uploadMediaBase64(input.base64, input.filename, input.type || "image");
        if (!result) throw new Error("Upload failed");
        return result;
      }),

    // Rewrite all existing articles through the smart rewriter
    rewriteAll: adminProcedure.mutation(async () => {
      const allArts = await getAllArticles(500, 0);
      let rewritten = 0;
      let skipped = 0;
      const errors: string[] = [];
      for (const art of allArts) {
        try {
          const result = await rewriteArticle(art.title, art.content);
          if (result.content && result.content.replace(/<[^>]*>/g, "").trim().length > 30) {
            await updateArticle(art.id, {
              title: result.title,
              content: result.content,
              excerpt: result.content.replace(/<[^>]*>/g, "").substring(0, 300) + "...",
            });
            rewritten++;
          } else {
            // Content was empty after rewrite — keep original, don't destroy it
            skipped++;
            if (errors.length < 5) errors.push(`Empty after rewrite: ${art.title.substring(0, 40)}`);
          }
        } catch (e: any) {
          skipped++;
          if (errors.length < 5) errors.push(`Error: ${art.title.substring(0, 40)} — ${e?.message || "unknown"}`);
        }
      }
      return { rewritten, skipped, total: allArts.length, errors };
    }),

    // Blocked Words
    blockedWordsGet: adminProcedure.query(() => {
      return getBlockedWords();
    }),

    blockedWordsSet: adminProcedure
      .input(z.object({ words: z.array(z.string()) }))
      .mutation(({ input }) => {
        setBlockedWords(input.words);
        return { success: true, words: getBlockedWords() };
      }),

    mediaDelete: adminProcedure
      .input(z.object({ publicId: z.string(), type: z.enum(["image", "video"]).optional() }))
      .mutation(async ({ input }) => {
        const ok = await deleteMedia(input.publicId, input.type || "image");
        if (!ok) throw new Error("Delete failed");
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
