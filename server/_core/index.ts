import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startCronScheduler } from "../cronScheduler";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Configure body parser and cookies
  app.use(cookieParser());
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

  // Detailed health check endpoint
  app.get("/health", async (_req, res) => {
    const { getPublishedArticles, getAllCategories, getDb } = await import("../db");
    const { getLastImportResult, isImportRunning, getLastWipeTime } = await import("../cronScheduler");

    let dbStatus = "disconnected";
    let articleCount = 0;
    let categoryCount = 0;
    let dbSizeMb = 0;
    try {
      const db = await getDb();
      if (db) {
        dbStatus = "connected";
        const cats = await getAllCategories();
        categoryCount = cats.length;
        const { articles } = await import("../../drizzle/schema");
        const { eq, sql } = await import("drizzle-orm");
        const countResult = await db.select({ count: sql<number>`count(*)` }).from(articles).where(eq(articles.status, "published"));
        articleCount = countResult[0]?.count ?? 0;
        // DB size
        const sizeResult = await db.execute(sql`SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb FROM information_schema.tables WHERE table_schema = DATABASE()`);
        dbSizeMb = parseFloat((sizeResult as any)[0]?.[0]?.size_mb || "0");
      }
    } catch (e: any) {
      dbStatus = `error: ${e.message}`;
    }

    const lastImport = getLastImportResult();
    const importRunning = isImportRunning();
    const lastWipe = getLastWipeTime();

    const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
    const dbUrlSet = !!process.env.DATABASE_URL;

    res.status(200).json({
      status: dbStatus === "connected" && articleCount > 0 ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        urlConfigured: dbUrlSet,
        publishedArticles: articleCount,
        categories: categoryCount,
        sizeMb: dbSizeMb,
        maxSizeMb: 500,
      },
      importer: {
        running: importRunning,
        schedule: "Every 3 hours",
        sources: ["JOQ Albania", "VoxNews", "Versus"],
        lastResult: lastImport ? {
          timestamp: lastImport.timestamp,
          totalFetched: lastImport.totalFetched,
          newArticles: lastImport.newArticles,
          duplicatesSkipped: lastImport.duplicatesSkipped,
          skippedNoImage: lastImport.skippedNoImage,
          skippedNoContent: lastImport.skippedNoContent,
          errors: lastImport.errors,
        } : null,
      },
      maintenance: {
        wipeSchedule: "Every Monday at 4:00 AM UTC",
        lastWipe: lastWipe?.toISOString() || null,
      },
      services: {
        cloudinary: cloudinaryConfigured ? "configured" : "missing credentials",
      },
      uptime: Math.floor(process.uptime()),
    });
  });

  // robots.txt
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /search

Sitemap: https://vipatebllokut.com/sitemap.xml

# Vipat E Bllokut - Albania News & Media
# https://vipatebllokut.com
`);
  });

  // Dynamic sitemap.xml
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const { getPublishedArticles, getAllCategories } = await import("../db");
      const allArticles = await getPublishedArticles(500);
      const allCategories = await getAllCategories();
      const now = new Date().toISOString();

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
      xml += `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n`;
      xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

      // Homepage
      xml += `  <url>\n    <loc>https://vipatebllokut.com/</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>hourly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

      // Static pages
      const staticPages = [
        { path: "/about", priority: "0.7", freq: "monthly" },
        { path: "/contact", priority: "0.6", freq: "monthly" },
        { path: "/advertise", priority: "0.6", freq: "monthly" },
        { path: "/editorial-policy", priority: "0.4", freq: "yearly" },
        { path: "/privacy-policy", priority: "0.3", freq: "yearly" },
        { path: "/terms", priority: "0.3", freq: "yearly" },
        { path: "/gdpr", priority: "0.3", freq: "yearly" },
        { path: "/cookie-policy", priority: "0.3", freq: "yearly" },
      ];
      for (const page of staticPages) {
        xml += `  <url>\n    <loc>https://vipatebllokut.com${page.path}</loc>\n    <changefreq>${page.freq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
      }

      // Category pages
      for (const cat of allCategories) {
        xml += `  <url>\n    <loc>https://vipatebllokut.com/category/${cat.slug}</loc>\n    <changefreq>hourly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }

      // Article pages with news sitemap extension
      for (const article of allArticles) {
        const pubDate = article.publishedAt ? new Date(article.publishedAt).toISOString() : now;
        xml += `  <url>\n    <loc>https://vipatebllokut.com/article/${article.slug}</loc>\n    <lastmod>${pubDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n`;
        xml += `    <news:news>\n      <news:publication>\n        <news:name>Vipat E Bllokut</news:name>\n        <news:language>sq</news:language>\n      </news:publication>\n      <news:publication_date>${pubDate}</news:publication_date>\n      <news:title>${escapeXml(article.title)}</news:title>\n    </news:news>\n`;
        if (article.featuredImage) {
          xml += `    <image:image>\n      <image:loc>${escapeXml(article.featuredImage)}</image:loc>\n      <image:title>${escapeXml(article.title)}</image:title>\n    </image:image>\n`;
        }
        xml += `  </url>\n`;
      }

      xml += `</urlset>`;
      res.type("application/xml").send(xml);
    } catch (error) {
      console.error("[Sitemap] Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // RSS Feed for news aggregators
  app.get("/feed.xml", async (_req, res) => {
    try {
      const { getPublishedArticles } = await import("../db");
      const recentArticles = await getPublishedArticles(30);
      const now = new Date().toUTCString();

      let rss = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      rss += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">\n`;
      rss += `<channel>\n`;
      rss += `  <title>Vipat E Bllokut - Albania News &amp; Media</title>\n`;
      rss += `  <link>https://vipatebllokut.com</link>\n`;
      rss += `  <description>Portali kryesor i lajmeve shqiptare. Lajme t\u00eb fundit nga Shqip\u00ebria, Kosova dhe bota.</description>\n`;
      rss += `  <language>sq</language>\n`;
      rss += `  <lastBuildDate>${now}</lastBuildDate>\n`;
      rss += `  <atom:link href="https://vipatebllokut.com/feed.xml" rel="self" type="application/rss+xml" />\n`;
      rss += `  <image>\n    <url>https://vipatebllokut.com/api/og-image.png</url>\n    <title>Vipat E Bllokut</title>\n    <link>https://vipatebllokut.com</link>\n  </image>\n`;

      for (const article of recentArticles) {
        const pubDate = article.publishedAt ? new Date(article.publishedAt).toUTCString() : now;
        const excerpt = article.excerpt || article.content.replace(/<[^>]*>/g, "").substring(0, 300);
        rss += `  <item>\n`;
        rss += `    <title>${escapeXml(article.title)}</title>\n`;
        rss += `    <link>https://vipatebllokut.com/article/${article.slug}</link>\n`;
        rss += `    <guid isPermaLink="true">https://vipatebllokut.com/article/${article.slug}</guid>\n`;
        rss += `    <description>${escapeXml(excerpt)}</description>\n`;
        rss += `    <pubDate>${pubDate}</pubDate>\n`;
        if (article.featuredImage) {
          rss += `    <media:content url="${escapeXml(article.featuredImage)}" medium="image" />\n`;
          rss += `    <enclosure url="${escapeXml(article.featuredImage)}" type="image/jpeg" length="0" />\n`;
        }
        rss += `  </item>\n`;
      }

      rss += `</channel>\n</rss>`;
      res.type("application/rss+xml").send(rss);
    } catch (error) {
      console.error("[RSS Feed] Error generating feed:", error);
      res.status(500).send("Error generating feed");
    }
  });

  // OG image endpoint — serves a proper PNG for social sharing
  // Uploads SVG to Cloudinary on first request, caches the PNG URL
  let cachedOgImageUrl: string | null = null;
  app.get("/api/og-image.png", async (_req, res) => {
    if (cachedOgImageUrl) {
      return res.redirect(301, cachedOgImageUrl);
    }
    try {
      const { uploadImageBase64 } = await import("../cloudinaryStorage");
      // Generate a simple OG-friendly image via Cloudinary text overlay
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      if (cloudName) {
        // Use Cloudinary's text overlay API to generate a branded OG image
        const ogUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_1200,h_630,c_fill,b_rgb:1a1a2e/co_rgb:d4a843,l_text:Georgia_72_bold:Vipat%20E%20Bllokut/fl_layer_apply,g_center,y_-40/co_rgb:ffffff80,l_text:Arial_24:Albania%20News%20%26%20Media/fl_layer_apply,g_center,y_40/co_rgb:ffffff40,l_text:Arial_18:vipatebllokut.com/fl_layer_apply,g_center,y_90/vipat-media/og-placeholder.png`;
        // Upload a 1x1 placeholder to create the base image
        const base64Pixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        await uploadImageBase64(base64Pixel, "og-placeholder", "vipat-media").catch(() => {});
        cachedOgImageUrl = ogUrl;
        return res.redirect(301, ogUrl);
      }
      // Fallback: serve the SVG with correct content type
      res.redirect("/og-image.svg");
    } catch {
      res.redirect("/og-image.svg");
    }
  });

  // Page view tracking (non-blocking)
  app.use((req, _res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/") && !req.path.startsWith("/assets/") && !req.path.includes(".")) {
      import("../db").then(({ trackPageView }) => trackPageView(req.path)).catch(() => {});
    }
    next();
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
