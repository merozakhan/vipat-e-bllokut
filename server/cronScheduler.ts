/**
 * Cron Scheduler for Automated News Import + Database Maintenance
 *
 * - Every 3 hours: import new articles (max 50 per run)
 * - Every 6 days: wipe all articles and refill fresh
 * - On startup: wipe DB + import fresh articles
 */

import cron from "node-cron";
import { runRssImport, wipeArticles, type ImportResult } from "./rssImporter";

let lastImportResult: ImportResult | null = null;
let isRunning = false;
let importTask: ReturnType<typeof cron.schedule> | null = null;
let wipeTask: ReturnType<typeof cron.schedule> | null = null;

async function executeImport(): Promise<ImportResult | null> {
  if (isRunning) {
    console.log("[Cron] Import already in progress, skipping...");
    return null;
  }

  isRunning = true;
  try {
    const result = await runRssImport();
    lastImportResult = result;
    return result;
  } catch (error) {
    console.error("[Cron] RSS import failed:", error);
    return null;
  } finally {
    isRunning = false;
  }
}

async function executeWipeAndRefill(): Promise<void> {
  if (isRunning) {
    console.log("[Cron] Import running, waiting 60s before wipe...");
    await new Promise(resolve => setTimeout(resolve, 60_000));
    if (isRunning) {
      console.log("[Cron] Import still running, skipping wipe this cycle.");
      return;
    }
  }

  isRunning = true;
  try {
    console.log("[Cron] Starting scheduled database wipe...");
    await wipeArticles();
    console.log("[Cron] Wipe complete. Importing fresh articles...");
    const result = await runRssImport();
    lastImportResult = result;
    console.log(`[Cron] Refill complete: ${result.newArticles} fresh articles.`);
  } catch (error) {
    console.error("[Cron] Wipe+refill failed:", error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the cron scheduler.
 * - Every 3 hours: import new articles
 * - Every 6 days (Monday at 4 AM): wipe DB + refill
 * - On startup: wipe + fresh import
 */
export function startCronScheduler(): void {
  console.log("[Cron] Initializing scheduler...");

  // Schedule: every 3 hours at minute 0
  importTask = cron.schedule("0 */3 * * *", async () => {
    console.log(`[Cron] Scheduled import at ${new Date().toISOString()}`);
    await executeImport();
  });

  // Schedule: every 6 days - run at 4:00 AM on day 1, 7, 13, 19, 25 of each month
  // (roughly every 6 days)
  wipeTask = cron.schedule("0 4 */6 * *", async () => {
    console.log(`[Cron] Scheduled 6-day wipe at ${new Date().toISOString()}`);
    await executeWipeAndRefill();
  });

  console.log("[Cron] Active schedules:");
  console.log("[Cron]   - Import: every 3 hours at :00");
  console.log("[Cron]   - DB wipe + refill: every 6 days at 4:00 AM");

  // On startup: wipe DB and import fresh articles (30s delay for server init)
  setTimeout(async () => {
    console.log("[Cron] Startup: wiping DB and importing fresh articles...");
    await executeWipeAndRefill();
  }, 30_000);
}

/**
 * Stop the cron scheduler (for graceful shutdown)
 */
export function stopCronScheduler(): void {
  if (importTask) {
    importTask.stop();
    importTask = null;
  }
  if (wipeTask) {
    wipeTask.stop();
    wipeTask = null;
  }
  console.log("[Cron] Scheduler stopped.");
}

/**
 * Get the last import result (for status monitoring)
 */
export function getLastImportResult(): ImportResult | null {
  return lastImportResult;
}

/**
 * Check if an import is currently running
 */
export function isImportRunning(): boolean {
  return isRunning;
}

/**
 * Manually trigger an import (for admin use via tRPC)
 */
export async function triggerManualImport(): Promise<ImportResult | null> {
  return executeImport();
}
