import { describe, expect, it } from "vitest";
import {
  detectCategory,
  generateSlug,
  stripHtml,
  decodeHtmlEntities,
  validateArticle,
  containsCssJunk,
  isJunkText,
  normalizeTitle,
  titleSimilarity,
} from "./rssImporter";

describe("JOQ Albania Scraper", () => {
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

  describe("normalizeTitle", () => {
    it("lowercases and removes punctuation", () => {
      expect(normalizeTitle("Hello, World!")).toBe("hello world");
    });

    it("preserves Albanian diacritical characters", () => {
      expect(normalizeTitle("Kulturë dhe Art")).toBe("kulturë dhe art");
    });

    it("collapses whitespace", () => {
      expect(normalizeTitle("  Hello   World  ")).toBe("hello world");
    });
  });

  describe("titleSimilarity - cross-source deduplication", () => {
    it("returns 1.0 for identical titles", () => {
      const title = "Zelensky akuzon Rusinë për sulme të reja";
      expect(titleSimilarity(title, title)).toBe(1);
    });

    it("returns high similarity for same story from different sources", () => {
      const a = "Trump vendos sanksione të reja ndaj Rusisë";
      const b = "Trump vendos sanksione ndaj Rusisë";
      expect(titleSimilarity(a, b)).toBeGreaterThanOrEqual(0.7);
    });

    it("returns low similarity for completely different articles", () => {
      const a = "Futbolli: Skuadra fiton kampionatin";
      const b = "Zelensky akuzon Rusinë për sulme";
      expect(titleSimilarity(a, b)).toBeLessThan(0.3);
    });

    it("returns 0 for titles with only short words", () => {
      expect(titleSimilarity("A B C", "D E F")).toBe(0);
    });
  });
});
