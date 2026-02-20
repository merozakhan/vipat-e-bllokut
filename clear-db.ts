import { getDb } from "./server/db";
import { articles, articleCategories } from "./drizzle/schema";

async function clearDb() {
  const db = await getDb();
  console.log("Connected to database. Clearing tables...");
  
  try {
    // Using raw SQL for truncate as it's more efficient
    await db.execute("SET FOREIGN_KEY_CHECKS = 0;");
    await db.execute("TRUNCATE TABLE article_categories;");
    await db.execute("TRUNCATE TABLE articles;");
    await db.execute("SET FOREIGN_KEY_CHECKS = 1;");
    console.log("Successfully cleared article_categories and articles tables.");
  } catch (error) {
    console.error("Error clearing database:", error);
  } finally {
    process.exit(0);
  }
}

clearDb();
