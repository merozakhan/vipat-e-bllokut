import { describe, expect, it } from "vitest";
import {
  parseRssFeed,
  detectCategory,
  generateSlug,
  stripHtml,
  decodeHtmlEntities,
  validateArticle,
  containsCssJunk,
  isJunkText,
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
    it("detects sport category (slug-based)", () => {
      expect(detectCategory("Futbolli shqiptar", "", "aktualitet")).toBe("sport");
      expect(detectCategory("Kampionati i basketbollit", "", "aktualitet")).toBe("sport");
      expect(detectCategory("UEFA Champions League ndeshje", "", "aktualitet")).toBe("sport");
    });

    it("detects culture category as 'kulture' slug", () => {
      expect(detectCategory("Festival i muzikës", "", "aktualitet")).toBe("kulture");
      expect(detectCategory("Koncert i madh në Tiranë", "", "aktualitet")).toBe("kulture");
    });

    it("detects international category as 'bote' slug", () => {
      expect(detectCategory("Trump vendos sanksione", "", "aktualitet")).toBe("bote");
      expect(detectCategory("NATO mblidhet", "", "aktualitet")).toBe("bote");
      expect(detectCategory("Zelensky akuzon Rusinë", "", "aktualitet")).toBe("bote");
    });

    it("detects ekonomi category", () => {
      expect(detectCategory("Buxheti i ri i shtetit", "", "aktualitet")).toBe("ekonomi");
      expect(detectCategory("Inflacioni rritet", "", "aktualitet")).toBe("ekonomi");
    });

    it("detects teknologji category", () => {
      expect(detectCategory("Teknologjia e re digjitale", "", "aktualitet")).toBe("teknologji");
      expect(detectCategory("NASA lëshon satelit", "", "aktualitet")).toBe("teknologji");
    });

    it("detects shendetesi category", () => {
      expect(detectCategory("Shëndeti mendor", "", "aktualitet")).toBe("shendetesi");
      expect(detectCategory("Spitali i madh hap dyert", "", "aktualitet")).toBe("shendetesi");
      expect(detectCategory("Vaksina e re kundër kancerit", "", "aktualitet")).toBe("shendetesi");
    });

    it("uses score-based matching (highest score wins)", () => {
      // Title with multiple sport keywords should beat a single bote keyword
      expect(detectCategory("Futbolli: Skuadra fiton kampionatin", "ndeshje e madhe", "aktualitet")).toBe("sport");
    });

    it("falls back to default category when no keywords match", () => {
      expect(detectCategory("Lajme lokale", "", "aktualitet")).toBe("aktualitet");
    });

    it("checks description too", () => {
      expect(detectCategory("Lajm", "Ndeshja e futbollit", "aktualitet")).toBe("sport");
    });
  });

  describe("validateArticle - STRICT RULE: title + content + image required", () => {
    it("accepts article with all three required fields", () => {
      const result = validateArticle(
        "Test Title",
        "This is a long enough content that exceeds the minimum 50 character requirement for articles.",
        "https://example.com/image.jpg"
      );
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("rejects article with missing title", () => {
      const result = validateArticle(
        "",
        "This is a long enough content that exceeds the minimum 50 character requirement.",
        "https://example.com/image.jpg"
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("title");
    });

    it("rejects article with missing content", () => {
      const result = validateArticle(
        "Test Title",
        "Short",
        "https://example.com/image.jpg"
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("content");
    });

    it("rejects article with missing image (null)", () => {
      const result = validateArticle(
        "Test Title",
        "This is a long enough content that exceeds the minimum 50 character requirement.",
        null
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("image");
    });

    it("rejects article with empty image string", () => {
      const result = validateArticle(
        "Test Title",
        "This is a long enough content that exceeds the minimum 50 character requirement.",
        ""
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("image");
    });

    it("rejects article with whitespace-only title", () => {
      const result = validateArticle(
        "   ",
        "This is a long enough content that exceeds the minimum 50 character requirement.",
        "https://example.com/image.jpg"
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("title");
    });

    it("rejects article with content under 50 characters", () => {
      const result = validateArticle(
        "Test Title",
        "Only 49 characters of content here, not enough!",
        "https://example.com/image.jpg"
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("content");
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

    it("returns null imageUrl when no image is present", () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>Article without Image</title>
              <link>https://example.com/article</link>
              <description>No image here</description>
            </item>
          </channel>
        </rss>`;

      const articles = parseRssFeed(xml, testFeed);
      expect(articles).toHaveLength(1);
      expect(articles[0].imageUrl).toBeNull();
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
    it("has at least 10 feed sources configured", () => {
      expect(RSS_FEEDS.length).toBeGreaterThanOrEqual(10);
    });

    it("all feeds have required properties", () => {
      for (const feed of RSS_FEEDS) {
        expect(feed.name).toBeTruthy();
        expect(feed.url).toMatch(/^https?:\/\//);
        expect(feed.defaultCategory).toBeTruthy();
      }
    });

    it("includes reliable Albanian media sources with images", () => {
      const names = RSS_FEEDS.map(f => f.name.toLowerCase());
      // Original feeds
      expect(names.some(n => n.includes("koha"))).toBe(true);
      expect(names.some(n => n.includes("gazeta"))).toBe(true);
      expect(names.some(n => n.includes("reporter"))).toBe(true);
      expect(names.some(n => n.includes("telegrafi"))).toBe(true);
      expect(names.some(n => n.includes("albeu"))).toBe(true);
      // New feeds
      expect(names.some(n => n.includes("news24"))).toBe(true);
      expect(names.some(n => n.includes("vizion"))).toBe(true);
      expect(names.some(n => n.includes("balkaninsight"))).toBe(true);
      expect(names.some(n => n.includes("epoka"))).toBe(true);
      expect(names.some(n => n.includes("zeri"))).toBe(true);
    });

    it("does NOT include feeds without reliable images", () => {
      const names = RSS_FEEDS.map(f => f.name.toLowerCase());
      // These feeds were removed because they don't provide images
      expect(names.some(n => n.includes("balkanweb"))).toBe(false);
      expect(names.some(n => n.includes("lapsi"))).toBe(false);
      expect(names.some(n => n.includes("panorama"))).toBe(false);
    });
  });

  describe("containsCssJunk", () => {
    it("detects CSS class selectors", () => {
      expect(containsCssJunk(".numbered-teaser .posts-wrapper{counter-reset:cnt}")).toBe(true);
      expect(containsCssJunk(".widget__head{position:relative}")).toBe(true);
      expect(containsCssJunk(".share-facebook something")).toBe(true);
    });

    it("detects CSS property patterns", () => {
      expect(containsCssJunk("background-color: var(--primary-text-color)")).toBe(true);
      expect(containsCssJunk("border-radius: var(--1x)")).toBe(true);
      expect(containsCssJunk("counter-increment: cnt")).toBe(true);
    });

    it("detects JS patterns", () => {
      expect(containsCssJunk("adIds = [123, 456]")).toBe(true);
      expect(containsCssJunk("getAdHtml(slot)")).toBe(true);
      expect(containsCssJunk("injectAds(container)")).toBe(true);
    });

    it("does NOT flag clean article text", () => {
      expect(containsCssJunk("Presidenti ukrainas Volodymyr Zelensky tha se inteligjenca tregonte se Rusia po përgatit sulme.")).toBe(false);
      expect(containsCssJunk("Kancelari gjerman Friedrich Merz nuk do të udhëtojë në Uashington.")).toBe(false);
      expect(containsCssJunk("Frutat janë thelbësore për një ushqyerje të shëndetshme.")).toBe(false);
    });
  });

  describe("isJunkText", () => {
    it("detects lines starting with CSS selectors", () => {
      expect(isJunkText(".numbered-teaser .posts-wrapper")).toBe(true);
      expect(isJunkText("#main-content { display: block }")).toBe(true);
      expect(isJunkText("@media (max-width: 768px)")).toBe(true);
    });

    it("detects CSS property patterns", () => {
      expect(isJunkText("something {display: flex; margin: 0; padding: 10px;}")).toBe(true);
    });

    it("detects JS patterns", () => {
      expect(isJunkText("window.addEventListener('load', fn)")).toBe(true);
      expect(isJunkText("document.querySelector('.article')")).toBe(true);
    });

    it("does NOT flag clean text", () => {
      expect(isJunkText("Presidenti ukrainas Volodymyr Zelensky tha se inteligjenca tregonte.")).toBe(false);
      expect(isJunkText("Frutat janë thelbësore për një ushqyerje të shëndetshme.")).toBe(false);
    });
  });
});
