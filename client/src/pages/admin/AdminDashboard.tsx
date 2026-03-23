import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { FileText, Plus, Eye, TrendingUp, Users, Calendar, BarChart3, ArrowUpRight, ArrowDownRight, Trophy } from "lucide-react";
import AdminLayout from "./AdminLayout";

export default function AdminDashboard() {
  const { data: articles } = trpc.admin.articlesList.useQuery({ limit: 5 });
  const { data: articleStats } = trpc.admin.articleStats.useQuery();
  const { data: analytics } = trpc.admin.analyticsStats.useQuery();
  const { data: topArticles } = trpc.admin.topArticles.useQuery({ limit: 5 });

  const todayVsYesterday = analytics && analytics.yesterday > 0
    ? Math.round(((analytics.today - analytics.yesterday) / analytics.yesterday) * 100)
    : null;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-black text-foreground">Paneli Kryesor</h1>
        <Link href="/admin/articles/new">
          <span className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gold text-navy-dark font-bold text-xs md:text-sm rounded-lg hover:bg-gold-light transition-colors cursor-pointer font-sans">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Artikull i Ri</span>
            <span className="sm:hidden">Ri</span>
          </span>
        </Link>
      </div>

      {/* Article Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-card border border-border/50 rounded-xl p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-black text-foreground">{articleStats?.total ?? "—"}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground font-sans">Artikujt Gjithsej</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-black text-foreground">{articleStats?.published ?? "—"}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground font-sans">Publikuar</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-black text-foreground">{articleStats?.draft ?? "—"}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground font-sans">Drafte</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-black text-foreground">{articleStats?.totalViews?.toLocaleString() ?? "—"}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground font-sans">Shikimet Gjithsej</p>
            </div>
          </div>
        </div>
      </div>

      {/* Visitor Analytics */}
      <div className="bg-card border border-border/50 rounded-xl mb-6">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <Users className="w-4 h-4 text-gold" />
          <h2 className="text-sm font-bold text-foreground">Analitika e Vizitorëve</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border/30">
          <div className="p-4 md:p-5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-xl md:text-2xl font-black text-foreground">{analytics?.today?.toLocaleString() ?? "—"}</p>
              {todayVsYesterday !== null && (
                <span className={`flex items-center text-[10px] font-bold ${todayVsYesterday >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {todayVsYesterday >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(todayVsYesterday)}%
                </span>
              )}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground font-sans">Sot</p>
          </div>
          <div className="p-4 md:p-5 text-center">
            <p className="text-xl md:text-2xl font-black text-foreground mb-1">{analytics?.yesterday?.toLocaleString() ?? "—"}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground font-sans">Dje</p>
          </div>
          <div className="p-4 md:p-5 text-center">
            <p className="text-xl md:text-2xl font-black text-foreground mb-1">{analytics?.thisWeek?.toLocaleString() ?? "—"}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground font-sans">Kjo Javë</p>
          </div>
          <div className="p-4 md:p-5 text-center">
            <p className="text-xl md:text-2xl font-black text-foreground mb-1">{analytics?.thisMonth?.toLocaleString() ?? "—"}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground font-sans">Ky Muaj</p>
          </div>
        </div>
        {/* All-time bar */}
        <div className="px-4 md:px-5 py-3 border-t border-border/30 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-sans">Gjithë Kohës</span>
          <span className="text-sm font-bold text-foreground">{analytics?.allTime?.toLocaleString() ?? "—"} shikime</span>
        </div>
        {/* Mini chart - daily breakdown */}
        {analytics?.dailyBreakdown && analytics.dailyBreakdown.length > 1 && (
          <div className="px-4 md:px-5 pb-4">
            <p className="text-[10px] text-muted-foreground font-sans mb-2 uppercase tracking-wider">30 Ditët e Fundit</p>
            <div className="flex items-end gap-[2px] h-16 md:h-20">
              {(() => {
                const days = analytics.dailyBreakdown.slice().reverse();
                const max = Math.max(...days.map(d => d.views), 1);
                // Fill in missing days
                const filled: { date: string; views: number }[] = [];
                const now = new Date();
                for (let i = 29; i >= 0; i--) {
                  const d = new Date(now);
                  d.setDate(d.getDate() - i);
                  const dateStr = d.toISOString().split("T")[0];
                  const found = days.find(x => x.date === dateStr);
                  filled.push({ date: dateStr, views: found?.views ?? 0 });
                }
                return filled.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gold/20 hover:bg-gold/40 rounded-t transition-colors relative group"
                    style={{ height: `${Math.max((d.views / max) * 100, 2)}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                      <div className="bg-card border border-border rounded px-2 py-1 text-[9px] font-sans text-foreground whitespace-nowrap shadow-lg">
                        {d.date.slice(5)}: {d.views}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Top Articles + Recent Articles side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-0">

      {/* Top Articles by Views */}
      {topArticles && topArticles.length > 0 && (
        <div className="bg-card border border-border/50 rounded-xl">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold" />
            <h2 className="text-sm font-bold text-foreground">Artikujt Më të Lexuar</h2>
          </div>
          <div className="divide-y divide-border/30">
            {topArticles.map((a, i) => (
              <Link key={a.id} href={`/admin/articles/${a.id}/edit`}>
                <div className="flex items-center gap-3 p-3 md:p-4 hover:bg-card/80 cursor-pointer transition-colors">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-sans flex-shrink-0 ${
                    i === 0 ? "bg-gold/20 text-gold" : i === 1 ? "bg-gray-400/20 text-gray-400" : i === 2 ? "bg-orange-400/20 text-orange-400" : "bg-card text-muted-foreground"
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-semibold text-foreground truncate">{a.title}</p>
                  </div>
                  <span className="text-xs font-bold text-gold font-sans">{a.views?.toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Articles */}
      <div className="bg-card border border-border/50 rounded-xl">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Artikujt e Fundit</h2>
          <Link href="/admin/articles">
            <span className="text-xs text-gold font-sans cursor-pointer hover:underline">Shiko të Gjitha</span>
          </Link>
        </div>
        <div className="divide-y divide-border/30">
          {articles?.map((a) => (
            <Link key={a.id} href={`/admin/articles/${a.id}/edit`}>
              <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-card/80 cursor-pointer transition-colors">
                {a.featuredImage && (
                  <img src={a.featuredImage} alt="" className="w-10 h-10 md:w-12 md:h-12 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-semibold text-foreground truncate">{a.title}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground font-sans">
                    {a.views} shikime
                  </p>
                </div>
                <span className={`hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-full font-sans ${
                  a.status === "published" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                }`}>
                  {a.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      </div>{/* close grid */}
    </AdminLayout>
  );
}
