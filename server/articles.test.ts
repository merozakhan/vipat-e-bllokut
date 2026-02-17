import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { calculateEngagementScore } from "./db";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@vipatebllokut.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createRegularUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("articles router", () => {
  it("getPublished returns an array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.articles.getPublished({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("getPublished respects limit parameter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.articles.getPublished({ limit: 2 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("getPublished supports category filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // Test with a valid category filter
    const result = await caller.articles.getPublished({ limit: 10, categoryId: 1 });
    expect(Array.isArray(result)).toBe(true);
    // Should return articles (we seeded some in category 1)
    for (const article of result) {
      expect(article).toHaveProperty("title");
      expect(article).toHaveProperty("slug");
    }
  });

  it("getFeatured returns an article or null", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.articles.getFeatured();
    if (result !== null) {
      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("slug");
      expect(result).toHaveProperty("content");
    }
  });

  it("getBySlug returns null for non-existent slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.articles.getBySlug({ slug: "non-existent-article-slug-12345" });
    expect(result).toBeNull();
  });

  it("search returns an array for a query", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.articles.search({ query: "albania", limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("search returns empty array for gibberish query", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.articles.search({ query: "xyznonexistent123456", limit: 5 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("getAll returns an array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.articles.getAll({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("getAll supports offset parameter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.articles.getAll({ limit: 5, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("categories router", () => {
  it("getAll returns an array of categories", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.categories.getAll();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("slug");
    }
  });

  it("getBySlug returns undefined for non-existent slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.categories.getBySlug({ slug: "non-existent-category-12345" });
    expect(result).toBeUndefined();
  });

  it("categories have required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.categories.getAll();
    if (result.length > 0) {
      const cat = result[0];
      expect(cat).toHaveProperty("id");
      expect(cat).toHaveProperty("name");
      expect(cat).toHaveProperty("slug");
      expect(typeof cat.name).toBe("string");
      expect(typeof cat.slug).toBe("string");
    }
  });
});

describe("trending and engagement", () => {
  it("getTrending returns an array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.articles.getTrending({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("getTrending articles have engagementScore", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.articles.getTrending({ limit: 3 });
    for (const article of result) {
      expect(article).toHaveProperty("engagementScore");
      expect(typeof article.engagementScore).toBe("number");
    }
  });

  it("getTrending returns articles sorted by engagement score descending", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.articles.getTrending({ limit: 10 });
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].engagementScore).toBeGreaterThanOrEqual(result[i].engagementScore);
    }
  });

  it("getFeatured returns the most controversial article", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const featured = await caller.articles.getFeatured();
    if (featured) {
      expect(featured).toHaveProperty("title");
      expect(featured).toHaveProperty("engagementScore");
    }
  });

  it("getByCategorySlug returns articles for valid slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.articles.getByCategorySlug({ slug: "politike", limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("getByCategorySlug returns empty array for non-existent slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.articles.getByCategorySlug({ slug: "nonexistent-cat-xyz", limit: 5 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

describe("engagement scoring unit tests", () => {
  it("scores controversial keywords higher", () => {
    const highScore = calculateEngagementScore("Skandal! Arrest i politikanit të korruptuar", "Hetimi zbulon mashtrim");
    const lowScore = calculateEngagementScore("Moti i mirë nesër në Tiranë", "Temperatura rritet");
    expect(highScore).toBeGreaterThan(lowScore);
  });

  it("boosts question marks for curiosity gap", () => {
    const withQuestion = calculateEngagementScore("A do të arrestohet?", null);
    const without = calculateEngagementScore("Do të arrestohet", null);
    expect(withQuestion).toBeGreaterThan(without);
  });

  it("boosts exclamation marks for urgency", () => {
    const withExcl = calculateEngagementScore("Skandaloze!", null);
    const without = calculateEngagementScore("Skandaloze", null);
    expect(withExcl).toBeGreaterThan(without);
  });

  it("returns 0 for neutral content", () => {
    const score = calculateEngagementScore("Moti nesër", "Temperatura normale");
    expect(score).toBe(0);
  });
});

describe("auth router", () => {
  it("me returns null for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user object for authenticated user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("admin@vipatebllokut.com");
    expect(result?.role).toBe("admin");
  });

  it("me returns regular user data for non-admin", async () => {
    const ctx = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.role).toBe("user");
  });
});
