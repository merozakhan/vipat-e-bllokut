import { describe, expect, it } from "vitest";
import {
  parseRssFeed,
  detectCategory,
  generateSlug,
  stripHtml,
  decodeHtmlEntities,
  RSS_FEEDS,
  type FeedSource,
} from "./rssImporter";

describe("RSS Importer", () => {
  describe("decodeHtmlEntities", () => {
    it("decodes common HTML entities", () => {
      expect(decodeHtmlEntities("&amp;")).toBe("&");
      expect(decodeHtmlEntities("&lt;")).toBe("<");
      expect(decodeHtmlEntities("&gt;")).toBe(">");
      expect(decodeHtmlEntities("&quot;")).toBe('"');
      expect(decodeHtmlEntities("&hellip;")).toBe("…");
      expect(decodeHtmlEntities("&#8217;")).toBe("'");
    });

    it("handles text without entities", () => {
      expect(decodeHtmlEntities("Hello World")).toBe("Hello World");
    });

    it("decodes numeric character references", () => {
      expect(decodeHtmlEntities("&#65;")).toBe("A");
      expect(decodeHtmlEntities("&#97;")).toBe("a");
    });
  });

  describe("stripHtml", () => {
    it("removes HTML tags", () => {
      expect(stripHtml("<p>Hello <b>World</b></p>")).toBe("Hello World");
    });

    it("normalizes whitespace", () => {
      expect(stripHtml("<p>Hello</p>  <p>World</p>")).toBe("Hello World");
    });

    it("handles empty string", () => {
      expect(stripHtml("")).toBe("");
    });

    it("handles text without HTML", () => {
      expect(stripHtml("Plain text")).toBe("Plain text");
    });
  });

  describe("generateSlug", () => {
    it("converts title to URL-friendly slug", () => {
      expect(generateSlug("Hello World")).toBe("hello-world");
    });

    it("removes special characters", () => {
      expect(generateSlug("Albania's Tourism!")).toBe("albanias-tourism");
    });

    it("handles Albanian characters", () => {
      expect(generateSlug("Kulturë dhe Art")).toBe("kulture-dhe-art");
    });

    it("collapses multiple hyphens", () => {
      expect(generateSlug("Hello   World---Test")).toBe("hello-world-test");
    });

    it("truncates long slugs to 200 characters", () => {
      const longTitle = "A".repeat(300);
      const slug = generateSlug(longTitle);
      expect(slug.length).toBeLessThanOrEqual(200);
    });
  });

  describe("detectCategory", () => {
    it("detects sport category", () => {
      expect(detectCategory("Futbolli shqiptar", "", "aktualitet")).toBe("sport");
      expect(detectCategory("Kampionati i basketbollit", "", "aktualitet")).toBe("sport");
    });

    it("detects culture category", () => {
      expect(detectCategory("Festival i muzikës", "", "aktualitet")).toBe("kulturë");
      expect(detectCategory("Ekspozita e artit", "", "aktualitet")).toBe("kulturë");
    });

    it("detects international category", () => {
      expect(detectCategory("Trump vendos sanksione", "", "aktualitet")).toBe("botë");
      expect(detectCategory("NATO mblidhet", "", "aktualitet")).toBe("botë");
    });

    it("falls back to default category", () => {
      expect(detectCategory("Lajme lokale", "", "aktualitet")).toBe("aktualitet");
    });

    it("checks description too", () => {
      expect(detectCategory("Lajm", "Ndeshja e futbollit", "aktualitet")).toBe("sport");
    });
  });

  describe("parseRssFeed", () => {
    const testFeed: FeedSource = {
      name: "Test Feed",
      url: "https://example.com/feed",
      defaultCategory: "aktualitet",
    };

    it("parses standard RSS items", () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <item>
              <title>Test Article Title</title>
              <link>https://example.com/article-1</link>
              <description>This is a test article description</description>
              <pubDate>Mon, 17 Feb 2026 10:00:00 +0000</pubDate>
            </item>
            <item>
              <title>Second Article</title>
              <link>https://example.com/article-2</link>
              <description>Another test article</description>
              <pubDate>Mon, 17 Feb 2026 09:00:00 +0000</pubDate>
            </item>
          </channel>
        </rss>`;

      const articles = parseRssFeed(xml, testFeed);
      expect(articles).toHaveLength(2);
      expect(articles[0].title).toBe("Test Article Title");
      expect(articles[0].link).toBe("https://example.com/article-1");
      expect(articles[0].description).toBe("This is a test article description");
      expect(articles[0].source).toBe("Test Feed");
      expect(articles[1].title).toBe("Second Article");
    });

    it("extracts images from media:content", () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
          <channel>
            <item>
              <title>Article with Image</title>
              <link>https://example.com/article</link>
              <description>Description</description>
              <media:content url="https://example.com/image.jpg" medium="image"/>
            </item>
          </channel>
        </rss>`;

      const articles = parseRssFeed(xml, testFeed);
      expect(articles).toHaveLength(1);
      expect(articles[0].imageUrl).toBe("https://example.com/image.jpg");
    });

    it("handles empty feed", () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Empty Feed</title>
          </channel>
        </rss>`;

      const articles = parseRssFeed(xml, testFeed);
      expect(articles).toHaveLength(0);
    });

    it("detects sport category from title keywords", () => {
      const sportFeed: FeedSource = {
        name: "Test Sport",
        url: "https://example.com/feed",
        defaultCategory: "aktualitet",
      };

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>Futbolli: Skuadra fiton kampionatin</title>
              <link>https://example.com/sport</link>
              <description>Lajme sportive</description>
            </item>
          </channel>
        </rss>`;

      const articles = parseRssFeed(xml, sportFeed);
      expect(articles).toHaveLength(1);
      expect(articles[0].category).toBe("sport");
    });
  });

  describe("RSS_FEEDS configuration", () => {
    it("has at least 5 feed sources configured", () => {
      expect(RSS_FEEDS.length).toBeGreaterThanOrEqual(5);
    });

    it("all feeds have required properties", () => {
      for (const feed of RSS_FEEDS) {
        expect(feed.name).toBeTruthy();
        expect(feed.url).toMatch(/^https?:\/\//);
        expect(feed.defaultCategory).toBeTruthy();
      }
    });

    it("includes major Albanian media sources", () => {
      const names = RSS_FEEDS.map(f => f.name.toLowerCase());
      expect(names.some(n => n.includes("koha"))).toBe(true);
      expect(names.some(n => n.includes("balkanweb"))).toBe(true);
      expect(names.some(n => n.includes("gazeta"))).toBe(true);
    });
  });
});
