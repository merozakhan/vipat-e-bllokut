/**
 * Cron Scheduler for Automated RSS Import
 * 
 * Runs the RSS importer every 3 hours to fetch new articles
 * from Albanian media sources. Also runs once on server startup
 * (with a 30-second delay to allow the server to fully initialize).
 */

import cron from "node-cron";
import { runRssImport, type ImportResult } from "./rssImporter";

let lastImportResult: ImportResult | null = null;
let isRunning = false;
let scheduledTask: ReturnType<typeof cron.schedule> | null = null;

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

/**
 * Start the cron scheduler.
 * - Runs every 3 hours: at minute 0 of hours 0, 3, 6, 9, 12, 15, 18, 21
 * - Also runs once 30 seconds after server startup
 */
export function startCronScheduler(): void {
  console.log("[Cron] Initializing RSS import scheduler (every 3 hours)...");

  // Schedule: every 3 hours at minute 0
  scheduledTask = cron.schedule("0 */3 * * *", async () => {
    console.log(`[Cron] Scheduled import triggered at ${new Date().toISOString()}`);
    await executeImport();
  });

  console.log("[Cron] Scheduler active. Next run: every 3 hours at :00");

  // Run initial import 30 seconds after startup
  setTimeout(async () => {
    console.log("[Cron] Running initial import after startup...");
    await executeImport();
  }, 30_000);
}

/**
 * Stop the cron scheduler (for graceful shutdown)
 */
export function stopCronScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("[Cron] Scheduler stopped.");
  }
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
