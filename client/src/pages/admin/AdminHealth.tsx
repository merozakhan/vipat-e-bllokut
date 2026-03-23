import { useEffect, useState } from "react";
import {
  Activity, Database, Cloud, Clock, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, Wifi, Zap, PenTool, Globe, Server,
  HardDrive, ImageIcon, Shield, TrendingUp, Play, Ban, Plus, X
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AdminLayout from "./AdminLayout";

interface HealthData {
  status: string;
  timestamp: string;
  database: {
    status: string;
    urlConfigured: boolean;
    publishedArticles: number;
    categories: number;
    sizeMb: number;
    maxSizeMb: number;
  };
  importer: {
    running: boolean;
    schedule: string;
    nextImportAt: string;
    sources: string[];
    lastResult: {
      timestamp: string;
      totalFetched: number;
      newArticles: number;
      duplicatesSkipped: number;
      skippedNoImage: number;
      skippedNoContent: number;
      errors: number;
    } | null;
  };
  maintenance: {
    wipeSchedule: string;
    lastWipe: string | null;
  };
  services: {
    cloudinary: string;
  };
  uptime: number;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatETA(isoString: string): string {
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff <= 0) return "any moment";
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  if (hours > 0) return `${hours}h ${remainMins}m`;
  return `${mins}m`;
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

function ServiceCard({ icon: Icon, name, status, detail, color }: {
  icon: any; name: string; status: "active" | "standby" | "error";
  detail?: string; color: string;
}) {
  const statusConfig = {
    active: { label: "Active", dotColor: "bg-green-400", bgColor: "bg-green-500/5 border-green-500/20", textColor: "text-green-400" },
    standby: { label: "Standby", dotColor: "bg-blue-400", bgColor: "bg-blue-500/5 border-blue-500/20", textColor: "text-blue-400" },
    error: { label: "Error", dotColor: "bg-red-400", bgColor: "bg-red-500/5 border-red-500/20", textColor: "text-red-400" },
  };
  const cfg = statusConfig[status];

  return (
    <div className={`rounded-xl border p-4 ${cfg.bgColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="flex items-center gap-1.5">
          <PulsingDot color={cfg.dotColor} />
          <span className={`text-[10px] font-bold uppercase tracking-wider font-sans ${cfg.textColor}`}>{cfg.label}</span>
        </div>
      </div>
      <p className="text-sm font-bold text-foreground">{name}</p>
      {detail && <p className="text-[10px] text-muted-foreground font-sans mt-0.5">{detail}</p>}
    </div>
  );
}

function SourceCard({ name, url, active, lastFetched, nextIn }: {
  name: string; url: string; active: boolean; lastFetched?: string; nextIn?: string;
}) {
  return (
    <div className="rounded-xl border p-4 bg-green-500/5 border-green-500/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-green-400" />
          <span className="text-sm font-bold text-foreground">{name}</span>
        </div>
        <PulsingDot color={active ? "bg-green-400" : "bg-blue-400"} />
      </div>
      <p className="text-[10px] text-muted-foreground font-sans truncate">{url}</p>
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/20">
        <span className={`text-[10px] font-semibold font-sans ${active ? "text-green-400" : "text-blue-400"}`}>
          {active ? "Scraping..." : "Ready"}
        </span>
        {lastFetched && (
          <>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-[10px] text-muted-foreground font-sans">Last: {lastFetched}</span>
          </>
        )}
        {nextIn && !active && (
          <>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-[10px] text-gold font-sans">Next: {nextIn}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminHealth() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState("");

  const { data: blockedWords } = trpc.admin.blockedWordsGet.useQuery();
  const utils = trpc.useUtils();
  const updateBlockedWords = trpc.admin.blockedWordsSet.useMutation({
    onSuccess: () => utils.admin.blockedWordsGet.invalidate(),
  });

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/health");
      const data = await res.json();
      setHealth(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to reach server");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  const triggerImport = trpc.rssImport.trigger.useMutation({
    onSuccess: (data) => {
      toast.success(`Import complete: ${data.result?.newArticles ?? 0} new articles`);
      fetchHealth();
    },
    onError: (e) => toast.error(e.message),
  });

  const rewriteAll = trpc.admin.rewriteAll.useMutation({
    onSuccess: (data) => {
      toast.success(`Rewritten ${data.rewritten}/${data.total} articles (${data.skipped} skipped)`);
      if (data.errors && data.errors.length > 0) {
        toast.error(data.errors.join("\n"), { duration: 10000 });
      }
    },
    onError: (e) => toast.error("Rewrite failed: " + e.message),
  });

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = health?.status === "healthy";
  const hasImported = !!health?.importer?.lastResult;
  const lastResult = health?.importer?.lastResult;
  const isRunning = health?.importer?.running;
  const nextETA = health?.importer?.nextImportAt ? formatETA(health.importer.nextImportAt) : null;
  const successRate = lastResult
    ? Math.round((lastResult.newArticles / Math.max(lastResult.totalFetched, 1)) * 100)
    : 0;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-gold" />
          <h1 className="text-xl md:text-2xl font-black text-foreground">System Health</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerImport.mutate()}
            disabled={triggerImport.isPending || !!isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-navy-dark font-bold rounded-lg text-xs transition-colors hover:bg-gold-light disabled:opacity-50 font-sans"
          >
            {triggerImport.isPending || isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {triggerImport.isPending ? "Importing..." : isRunning ? "Running..." : "Run Import"}
          </button>
          <button
            onClick={() => rewriteAll.mutate()}
            disabled={rewriteAll.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-300 font-bold rounded-lg text-xs transition-colors hover:bg-purple-500/30 disabled:opacity-50 font-sans"
          >
            {rewriteAll.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PenTool className="w-3.5 h-3.5" />
            )}
            {rewriteAll.isPending ? "Rewriting..." : "Rewrite All"}
          </button>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border/50 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
            <XCircle className="w-4 h-4" />
            Server Unreachable
          </div>
          <p className="text-red-400/70 text-xs mt-1">{error}</p>
        </div>
      )}

      {health && (
        <div className="space-y-5">

          {/* ═══ Overall Status Banner ═══ */}
          <div className={`rounded-xl border overflow-hidden ${isHealthy ? "border-green-500/20" : "border-yellow-500/20"}`}>
            <div className={`px-4 py-3 md:px-5 md:py-4 ${isHealthy ? "bg-green-500/5" : "bg-yellow-500/5"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isHealthy ? "bg-green-500/10" : "bg-yellow-500/10"}`}>
                    {isHealthy ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-foreground capitalize">All Systems {health.status}</h2>
                    <p className="text-xs text-muted-foreground font-sans">
                      Uptime: {formatUptime(health.uptime)} &middot; {new Date(health.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Quick stats bar */}
            <div className="grid grid-cols-3 divide-x divide-border/30 bg-card/30">
              <div className="p-3 text-center">
                <p className="text-lg md:text-xl font-black text-foreground">{health.database.publishedArticles}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-sans">Articles</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-lg md:text-xl font-black text-foreground">{health.database.sizeMb}<span className="text-xs text-muted-foreground font-normal">MB</span></p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-sans">DB Size</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-lg md:text-xl font-black text-foreground">{health.database.categories}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-sans">Categories</p>
              </div>
            </div>
          </div>

          {/* ═══ Pipeline Services ═══ */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-gold" />
              <h3 className="text-sm font-bold text-foreground">Pipeline Services</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <ServiceCard
                icon={Globe}
                name="Scraper"
                status={isRunning ? "active" : "standby"}
                detail={isRunning ? "Scraping articles now..." : nextETA ? `Next run in ${nextETA}` : hasImported ? `Last run ${formatTimeAgo(lastResult!.timestamp)}` : "Waiting for first run"}
                color="bg-blue-500"
              />
              <ServiceCard
                icon={PenTool}
                name="Rewriter"
                status={isRunning ? "active" : "standby"}
                detail={isRunning ? "Cleaning & rewriting..." : nextETA ? `Next run in ${nextETA}` : "Ready — strips branding, formats HTML"}
                color="bg-purple-500"
              />
              <ServiceCard
                icon={ImageIcon}
                name="Cloudinary"
                status={health.services.cloudinary === "configured" ? "active" : "error"}
                detail={health.services.cloudinary === "configured" ? "Image uploads ready" : "Missing credentials"}
                color="bg-pink-500"
              />
              <ServiceCard
                icon={Database}
                name="MySQL"
                status={health.database.status === "connected" ? "active" : "error"}
                detail={health.database.status === "connected" ? `${health.database.sizeMb}MB / ${health.database.maxSizeMb}MB` : health.database.status}
                color="bg-cyan-500"
              />
            </div>
          </div>

          {/* ═══ News Sources ═══ */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-gold" />
              <h3 className="text-sm font-bold text-foreground">News Sources</h3>
              <span className="text-[10px] text-muted-foreground font-sans ml-auto">Scraped every 3 hours</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SourceCard
                name="JOQ Albania"
                url="joq-albania.com"
                active={!!isRunning}
                lastFetched={hasImported ? formatTimeAgo(lastResult!.timestamp) : undefined}
                nextIn={nextETA || undefined}
              />
              <SourceCard
                name="VoxNews"
                url="voxnews.al"
                active={!!isRunning}
                lastFetched={hasImported ? formatTimeAgo(lastResult!.timestamp) : undefined}
                nextIn={nextETA || undefined}
              />
              <SourceCard
                name="Versus"
                url="versus.al"
                active={!!isRunning}
                lastFetched={hasImported ? formatTimeAgo(lastResult!.timestamp) : undefined}
                nextIn={nextETA || undefined}
              />
            </div>
          </div>

          {/* ═══ Last Import Results ═══ */}
          {lastResult && (
            <div className="bg-card/50 rounded-xl border border-border/30 overflow-hidden">
              <div className="p-4 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gold" />
                  <h3 className="text-sm font-bold text-foreground">Last Import Results</h3>
                </div>
                <span className="text-[10px] text-muted-foreground font-sans">{formatTimeAgo(lastResult.timestamp)}</span>
              </div>

              {/* Diagnosis for 0% */}
              {lastResult.totalFetched === 0 && (
                <div className="px-4 py-3 bg-red-500/5 border-b border-border/20">
                  <p className="text-xs text-red-400 font-sans font-semibold">No articles fetched — sources may be unreachable or blocking requests.</p>
                </div>
              )}
              {lastResult.totalFetched > 0 && lastResult.newArticles === 0 && (
                <div className="px-4 py-3 bg-yellow-500/5 border-b border-border/20">
                  <p className="text-xs text-yellow-400 font-sans font-semibold">
                    {lastResult.duplicatesSkipped > 0
                      ? `All ${lastResult.totalFetched} articles were duplicates — no new content from sources.`
                      : `${lastResult.totalFetched} fetched but none passed validation (image/content check).`}
                  </p>
                </div>
              )}

              {/* Success rate bar */}
              <div className="px-4 py-3 border-b border-border/20">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground font-sans">Success Rate</span>
                  <span className={`text-xs font-bold font-sans ${successRate > 50 ? "text-green-400" : successRate > 20 ? "text-yellow-400" : "text-red-400"}`}>{successRate}%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${successRate > 50 ? "bg-green-500" : successRate > 20 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${Math.max(successRate, 1)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-border/20">
                {[
                  { label: "Fetched", value: lastResult.totalFetched, color: "text-foreground", bg: "" },
                  { label: "Published", value: lastResult.newArticles, color: "text-green-400", bg: "bg-green-500/5" },
                  { label: "Duplicates", value: lastResult.duplicatesSkipped, color: "text-blue-400", bg: "" },
                  { label: "No Image", value: lastResult.skippedNoImage, color: "text-yellow-400", bg: "" },
                  { label: "No Content", value: lastResult.skippedNoContent, color: "text-orange-400", bg: "" },
                  { label: "Errors", value: lastResult.errors, color: lastResult.errors > 0 ? "text-red-400" : "text-foreground", bg: lastResult.errors > 0 ? "bg-red-500/5" : "" },
                ].map((stat) => (
                  <div key={stat.label} className={`p-3 md:p-4 text-center ${stat.bg}`}>
                    <p className={`text-lg md:text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-[8px] md:text-[9px] text-muted-foreground uppercase tracking-wider font-sans">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Blocked Words ═══ */}
          <div className="bg-card/50 rounded-xl border border-border/30 p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Ban className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-bold text-foreground">Blocked Words</h3>
              <span className="text-[10px] text-muted-foreground font-sans">Articles containing these words are skipped</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {blockedWords?.map(word => (
                <span key={word} className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-semibold text-red-400 font-sans">
                  {word}
                  <button
                    onClick={() => updateBlockedWords.mutate({ words: blockedWords.filter(w => w !== word) })}
                    className="hover:text-red-300 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {(!blockedWords || blockedWords.length === 0) && (
                <span className="text-xs text-muted-foreground font-sans">No blocked words set</span>
              )}
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (newWord.trim() && blockedWords) {
                  updateBlockedWords.mutate({ words: [...blockedWords, newWord.trim()] });
                  setNewWord("");
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={newWord}
                onChange={e => setNewWord(e.target.value)}
                placeholder="Add word to block..."
                className="flex-1 px-3 py-1.5 bg-background border border-border/50 rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-gold/50 font-sans"
              />
              <button
                type="submit"
                disabled={!newWord.trim()}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold font-sans hover:bg-red-500/30 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Block
              </button>
            </form>
          </div>

          {/* ═══ Database Storage ═══ */}
          <div className="bg-card/50 rounded-xl border border-border/30 p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-foreground">Storage</h3>
            </div>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground font-sans">Database Usage</span>
                <span className={`text-xs font-bold font-sans ${health.database.sizeMb > health.database.maxSizeMb * 0.8 ? "text-red-400" : health.database.sizeMb > health.database.maxSizeMb * 0.5 ? "text-yellow-400" : "text-green-400"}`}>
                  {health.database.sizeMb}MB / {health.database.maxSizeMb}MB
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${health.database.sizeMb > health.database.maxSizeMb * 0.8 ? "bg-red-500" : health.database.sizeMb > health.database.maxSizeMb * 0.5 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(100, (health.database.sizeMb / health.database.maxSizeMb) * 100)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  <p className="text-xs font-bold text-foreground">{health.maintenance?.wipeSchedule || "Not set"}</p>
                </div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-sans mt-1">Auto-Cleanup Schedule</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-green-400" />
                  <p className="text-xs font-bold text-foreground">{health.maintenance?.lastWipe ? formatTimeAgo(health.maintenance.lastWipe) : "Never"}</p>
                </div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-sans mt-1">Last Cleanup</p>
              </div>
            </div>
          </div>

          {/* ═══ Server Info ═══ */}
          <div className="bg-card/50 rounded-xl border border-border/30 p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-gold" />
              <h3 className="text-sm font-bold text-foreground">Server</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-background/50 rounded-lg text-center">
                <p className="text-lg font-black text-foreground">{formatUptime(health.uptime)}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-sans">Uptime</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg text-center">
                <p className="text-lg font-black text-foreground">Node 22</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-sans">Runtime</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg text-center">
                <p className="text-lg font-black text-green-400">Railway</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-sans">Platform</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg text-center">
                <p className="text-lg font-black text-foreground">3h</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-sans">Import Cycle</p>
              </div>
            </div>
          </div>

          {/* ═══ Diagnosis ═══ */}
          {health.database.publishedArticles === 0 && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-yellow-400 font-semibold text-sm mb-2">
                <AlertTriangle className="w-4 h-4" />
                No Articles Found — Diagnosis
              </div>
              <ul className="text-xs text-yellow-400/80 space-y-1 list-disc list-inside">
                {health.database.status !== "connected" && <li>Database is not connected. Check DATABASE_URL env var.</li>}
                {health.database.categories === 0 && <li>No categories found. The importer auto-seeds on first run.</li>}
                {health.services.cloudinary !== "configured" && <li>Cloudinary not configured. Articles need images to publish.</li>}
                {!hasImported && <li>No import has run yet. First import starts 30s after server boot.</li>}
                {hasImported && lastResult!.newArticles === 0 && lastResult!.errors > 0 && (
                  <li>Last import: {lastResult!.errors} errors, 0 new articles. Check server logs.</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {!health && !error && loading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      )}
    </AdminLayout>
  );
}
