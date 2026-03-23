/**
 * Cron Scheduler for Automated News Import + Database Maintenance
 *
 * - Every 3 hours: import new articles from JOQ, VoxNews, Versus (max 50 per run)
 * - Every Monday at 4 AM: wipe all articles and refill fresh (keeps DB under 500MB)
 * - On startup: import new articles (no wipe — preserves existing content)
 */

import cron from "node-cron";
import { runRssImport, wipeArticles, type ImportResult } from "./rssImporter";

let lastImportResult: ImportResult | null = null;
let lastWipeAt: Date | null = null;
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
    console.log("[Cron] Starting weekly database wipe...");
    await wipeArticles();
    lastWipeAt = new Date();
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
 * - Every 3 hours: import new articles (incremental)
 * - Every Monday at 4:00 AM UTC: wipe DB + refill (weekly cleanup)
 * - On startup: run an incremental import (30s delay)
 */
export function startCronScheduler(): void {
  console.log("[Cron] Initializing scheduler...");

  // Every 3 hours at minute 0: incremental import
  importTask = cron.schedule("0 */3 * * *", async () => {
    console.log(`[Cron] Scheduled import at ${new Date().toISOString()}`);
    await executeImport();
  });

  // Every Monday at 4:00 AM UTC: weekly wipe + refill
  wipeTask = cron.schedule("0 4 * * 1", async () => {
    console.log(`[Cron] Weekly wipe at ${new Date().toISOString()}`);
    await executeWipeAndRefill();
  });

  console.log("[Cron] Active schedules:");
  console.log("[Cron]   - Import: every 3 hours at :00");
  console.log("[Cron]   - DB wipe + refill: every Monday at 4:00 AM UTC");

  // On startup: run incremental import (no wipe — keeps existing articles)
  setTimeout(async () => {
    console.log("[Cron] Startup: importing new articles...");
    await executeImport();
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
 * Get the last wipe timestamp
 */
export function getLastWipeTime(): Date | null {
  return lastWipeAt;
}

/**
 * Get the next scheduled import time (next :00 that's a multiple of 3 hours)
 */
export function getNextImportTime(): Date {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const nextHour = Math.ceil((currentHour + 1) / 3) * 3;
  const next = new Date(now);
  next.setUTCHours(nextHour % 24, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

/**
 * Manually trigger an import (for admin use via tRPC)
 */
export async function triggerManualImport(): Promise<ImportResult | null> {
  return executeImport();
}
