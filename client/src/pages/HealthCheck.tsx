import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Activity, Database, Cloud, Clock, RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface HealthData {
  status: string;
  timestamp: string;
  database: {
    status: string;
    urlConfigured: boolean;
    publishedArticles: number;
    categories: number;
  };
  importer: {
    running: boolean;
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
  services: {
    cloudinary: string;
  };
  uptime: number;
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ok ? "bg-green-500/10 text-green-400 border border-green-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"}`}>
      {ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {label}
    </span>
  );
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

export default function HealthCheck() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = health?.status === "healthy";
  const isDegraded = health?.status === "degraded";

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-gold" />
            <h1 className="text-2xl font-black text-foreground">System Health</h1>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border/50 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
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
          <div className="space-y-4">
            {/* Overall Status */}
            <div className={`p-5 rounded-xl border ${isHealthy ? "bg-green-500/5 border-green-500/20" : isDegraded ? "bg-yellow-500/5 border-yellow-500/20" : "bg-red-500/5 border-red-500/20"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isHealthy ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-yellow-400" />
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-foreground capitalize">{health.status}</h2>
                    <p className="text-xs text-muted-foreground">Uptime: {formatUptime(health.uptime)}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(health.timestamp).toLocaleString()}</span>
              </div>
            </div>

            {/* Database */}
            <div className="p-5 bg-card/50 rounded-xl border border-border/30">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-foreground">Database</h3>
                <StatusBadge ok={health.database.status === "connected"} label={health.database.status} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-2xl font-black text-foreground">{health.database.publishedArticles}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-sans">Published Articles</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-2xl font-black text-foreground">{health.database.categories}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-sans">Categories</p>
                </div>
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-2xl font-black text-foreground">{health.database.urlConfigured ? "Yes" : "No"}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-sans">DB URL Set</p>
                </div>
              </div>
            </div>

            {/* Importer */}
            <div className="p-5 bg-card/50 rounded-xl border border-border/30">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className={`w-4 h-4 text-gold ${health.importer.running ? "animate-spin" : ""}`} />
                <h3 className="text-sm font-bold text-foreground">Article Importer</h3>
                {health.importer.running ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gold/10 text-gold border border-gold/30 animate-pulse">Running</span>
                ) : (
                  <StatusBadge ok={!!health.importer.lastResult && health.importer.lastResult.errors < 5} label="Idle" />
                )}
              </div>
              {health.importer.lastResult ? (
                <>
                  <p className="text-xs text-muted-foreground mb-3">
                    Last import: {formatTimeAgo(health.importer.lastResult.timestamp)}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {[
                      { label: "Fetched", value: health.importer.lastResult.totalFetched, color: "text-foreground" },
                      { label: "New", value: health.importer.lastResult.newArticles, color: "text-green-400" },
                      { label: "Duplicates", value: health.importer.lastResult.duplicatesSkipped, color: "text-blue-400" },
                      { label: "No Image", value: health.importer.lastResult.skippedNoImage, color: "text-yellow-400" },
                      { label: "No Content", value: health.importer.lastResult.skippedNoContent, color: "text-orange-400" },
                      { label: "Errors", value: health.importer.lastResult.errors, color: health.importer.lastResult.errors > 0 ? "text-red-400" : "text-foreground" },
                    ].map((stat) => (
                      <div key={stat.label} className="p-2 bg-background/50 rounded-lg text-center">
                        <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-sans">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No import has run yet. First import starts 30s after server boot.</p>
              )}
            </div>

            {/* Services */}
            <div className="p-5 bg-card/50 rounded-xl border border-border/30">
              <div className="flex items-center gap-2 mb-4">
                <Cloud className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-foreground">External Services</h3>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge ok={health.services.cloudinary === "configured"} label={`Cloudinary: ${health.services.cloudinary}`} />
              </div>
            </div>

            {/* Diagnosis */}
            {health.database.publishedArticles === 0 && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400 font-semibold text-sm mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  No Articles Found
                </div>
                <ul className="text-xs text-yellow-400/80 space-y-1 list-disc list-inside">
                  {health.database.status !== "connected" && <li>Database is not connected. Check DATABASE_URL env var.</li>}
                  {health.database.categories === 0 && <li>No categories in database. The importer needs categories to assign articles.</li>}
                  {health.services.cloudinary !== "configured" && <li>Cloudinary is not configured. Articles are skipped without image uploads.</li>}
                  {!health.importer.lastResult && <li>No import has run yet. Wait 30 seconds after server start.</li>}
                  {health.importer.lastResult && health.importer.lastResult.newArticles === 0 && health.importer.lastResult.errors > 0 && (
                    <li>Last import had {health.importer.lastResult.errors} errors and 0 new articles. Check server logs.</li>
                  )}
                  {health.importer.lastResult && health.importer.lastResult.skippedNoImage > 10 && (
                    <li>Many articles skipped due to missing images ({health.importer.lastResult.skippedNoImage}). Cloudinary upload may be failing.</li>
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
      </div>
    </Layout>
  );
}
