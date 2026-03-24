import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

const SOCIAL_BOT_REGEX = /facebookexternalhit|Facebot|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Pinterest|Discordbot|vkShare|Viber|Googlebot/i;

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // Inject correct OG meta tags for social bots on article pages
  app.use("*", async (req, res) => {
    const url = req.originalUrl;
    const ua = req.headers["user-agent"] || "";
    const indexPath = path.resolve(distPath, "index.html");

    // Only inject for article URLs when a social bot is crawling
    if (url.startsWith("/article/") && SOCIAL_BOT_REGEX.test(ua)) {
      try {
        const slug = url.replace("/article/", "").split("?")[0];
        const { getArticleWithCategories } = await import("../db");
        const article = await getArticleWithCategories({ slug });

        if (article) {
          let html = await fs.promises.readFile(indexPath, "utf-8");
          const title = `${article.title} | Vipat E Bllokut`;
          const description = article.content.replace(/<[^>]*>/g, "").substring(0, 200).trim();
          const image = article.featuredImage || "https://vipatebllokut.com/api/og-image.png";
          const articleUrl = `https://vipatebllokut.com/article/${slug}`;

          // Replace default OG tags with article-specific ones
          html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
          html = html.replace(/content="Vipat E Bllokut - Lajme Shqiptare \| Albania News & Media"/g, `content="${title}"`);
          html = html.replace(/content="Portali kryesor i lajmeve shqiptare[^"]*"/g, `content="${description}"`);
          html = html.replace(/content="https:\/\/vipatebllokut\.com\/api\/og-image\.png"/g, `content="${image}"`);
          html = html.replace(/content="https:\/\/vipatebllokut\.com\/"/g, `content="${articleUrl}"`);
          html = html.replace(/content="website"/, `content="article"`);

          return res.status(200).set({ "Content-Type": "text/html" }).end(html);
        }
      } catch (e) {
        console.warn("[OG] Failed to inject article meta:", e);
      }
    }

    res.sendFile(indexPath);
  });
}
