/**
 * Cron Scheduler for Automated News Import + Database Maintenance
 *
 * - Every 3 hours at :00: import new articles from VoxNews, Versus (max 50 per run)
 * - Every 3 hours at :30: scrape horoscopes (daily, weekly, monthly)
 * - 1st of every month at 4 AM: wipe all articles and refill fresh
 * - On startup: import new articles + scrape horoscopes
 */

import cron from "node-cron";
import { runRssImport, wipeArticles, scrapeHoroscope, type ImportResult } from "./rssImporter";

let lastImportResult: ImportResult | null = null;
let lastWipeAt: Date | null = null;
let isRunning = false;
let importTask: ReturnType<typeof cron.schedule> | null = null;
let wipeTask: ReturnType<typeof cron.schedule> | null = null;
let horoscopeTask: ReturnType<typeof cron.schedule> | null = null;

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
  console.log("[Cron] ALL SCRAPERS DISABLED — no imports, no horoscope, no wipe scheduled.");
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
  if (horoscopeTask) {
    horoscopeTask.stop();
    horoscopeTask = null;
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
