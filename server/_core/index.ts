import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startCronScheduler } from "../cronScheduler";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Configure body parser with larger size limit
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Image proxy to bypass hotlink protection from external news sites
  app.get("/api/image-proxy", async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    try {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(imageUrl);
      } catch {
        return res.status(400).json({ error: "Invalid URL" });
      }

      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          "Referer": parsedUrl.origin + "/",
          "Origin": parsedUrl.origin,
        },
        signal: AbortSignal.timeout(30000),
        redirect: "follow",
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch image" });
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      const buffer = Buffer.from(await response.arrayBuffer());

      // Cache for 7 days
      res.set({
        "Content-Type": contentType,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "public, max-age=604800, immutable",
        "X-Proxy-Source": "veb-image-proxy",
        "Access-Control-Allow-Origin": "*",
      });
      res.send(buffer);
    } catch (error: any) {
      console.error("[Image Proxy] Error:", imageUrl, error?.message || error);
      res.status(500).json({ error: "Failed to proxy image" });
    }
  });

  // Simple API endpoint for posting articles with secret key auth
  app.post("/api/articles", async (req, res) => {
    const apiKey = req.headers["x-api-key"] || req.query.apiKey;
    const expectedKey = process.env.ARTICLE_API_KEY;

    if (!expectedKey || apiKey !== expectedKey) {
      return res.status(401).json({ error: "Invalid or missing API key" });
    }

    try {
      const { title, content, excerpt, imageUrl, categoryIds, status } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      // Import db functions dynamically to avoid circular deps
      const { createArticle, getArticleBySlug, setArticleCategories } = await import("../db");

      // Generate slug
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      let slug = baseSlug;
      let counter = 1;
      while (await getArticleBySlug(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      await createArticle({
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 200) + "...",
        featuredImage: imageUrl || null,
        status: status || "published",
        authorId: 1,
        publishedAt: status === "published" || !status ? new Date() : null,
      });

      const article = await getArticleBySlug(slug);
      const articleId = article!.id;

      if (categoryIds && categoryIds.length > 0) {
        await setArticleCategories(articleId, categoryIds);
      }

      res.json({ success: true, articleId, slug });
    } catch (error: any) {
      console.error("[API] Error creating article:", error);
      res.status(500).json({ error: error.message || "Failed to create article" });
    }
  });

  // Simple health check endpoint for Railway
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: Date.now() });
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start the automated RSS import scheduler (every 3 hours)
    startCronScheduler();
  });
}

startServer().catch(console.error);
