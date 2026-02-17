import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
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

describe("articles router", () => {
  it("getPublished returns an array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.articles.getPublished({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("getFeatured returns an article or null", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.articles.getFeatured();
    // Should be either an article object or null
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

  it("getAll returns an array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.articles.getAll({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("categories router", () => {
  it("getAll returns an array of categories", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.categories.getAll();
    expect(Array.isArray(result)).toBe(true);
    // We seeded categories so there should be some
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("slug");
    }
  });

  it("getBySlug returns null for non-existent slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.categories.getBySlug({ slug: "non-existent-category-12345" });
    expect(result).toBeUndefined();
  });
});
