import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Plus, Trash2, Edit, Eye, Search, X, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import AdminLayout from "./AdminLayout";

const PLACEMENT_OPTIONS = [
  { value: "breaking", label: "Breaking" },
  { value: "trending", label: "Trending" },
  { value: "hot", label: "Hot" },
  { value: "most_read", label: "Most Read" },
] as const;

export default function AdminArticles() {
  const utils = trpc.useUtils();
  const { data: articles, isLoading } = trpc.admin.articlesList.useQuery({ limit: 100 });
  const { data: categories } = trpc.categories.getAll.useQuery();
  const deleteMutation = trpc.admin.articlesDelete.useMutation({
    onSuccess: () => utils.admin.articlesList.invalidate(),
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Search & filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [placementFilter, setPlacementFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = statusFilter !== "all" || placementFilter !== "all" || categoryFilter !== "all";

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    return articles.filter((a) => {
      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!a.title.toLowerCase().includes(q)) return false;
      }
      // Status filter
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      // Placement filter
      if (placementFilter !== "all") {
        if (placementFilter === "none" && a.homepagePlacement) return false;
        if (placementFilter !== "none" && a.homepagePlacement !== placementFilter) return false;
      }
      // Category filter
      if (categoryFilter !== "all") {
        const catId = parseInt(categoryFilter);
        if (!(a as any).categories?.some((c: any) => c.id === catId)) return false;
      }
      return true;
    });
  }, [articles, search, statusFilter, placementFilter, categoryFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPlacementFilter("all");
    setCategoryFilter("all");
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl md:text-2xl font-black text-foreground">Artikujt</h1>
        <Link href="/admin/articles/new">
          <span className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gold text-navy-dark font-bold text-xs md:text-sm rounded-lg hover:bg-gold-light transition-colors cursor-pointer font-sans">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Artikull i Ri</span>
            <span className="sm:hidden">Ri</span>
          </span>
        </Link>
      </div>

      {/* Search Bar & Filter Toggle */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kërko artikuj..."
            className="w-full pl-9 pr-8 py-2 bg-card border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50 font-sans"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-sans font-semibold transition-colors ${
            hasActiveFilters
              ? "bg-gold/10 border-gold/30 text-gold"
              : "bg-card border-border/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filtro</span>
          {hasActiveFilters && (
            <span className="w-4 h-4 rounded-full bg-gold text-navy-dark text-[10px] font-bold flex items-center justify-center">
              {[statusFilter !== "all", placementFilter !== "all", categoryFilter !== "all"].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Row */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-3 p-3 bg-card border border-border/50 rounded-lg">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-background border border-border/50 rounded-md text-xs text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-gold/50"
          >
            <option value="all">Të gjitha statuset</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-background border border-border/50 rounded-md text-xs text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-gold/50"
          >
            <option value="all">Të gjitha vendosjet</option>
            <option value="none">Pa vendosje</option>
            {PLACEMENT_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-background border border-border/50 rounded-md text-xs text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-gold/50"
          >
            <option value="all">Të gjitha kategoritë</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 font-sans font-medium"
            >
              <X className="w-3 h-3" />
              Pastro filtrat
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      {(search || hasActiveFilters) && !isLoading && (
        <p className="text-xs text-muted-foreground font-sans mb-3">
          {filteredArticles.length} nga {articles?.length || 0} artikuj
        </p>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-foreground mb-2">Fshi Artikullin?</h3>
            <p className="text-sm text-muted-foreground mb-4 font-sans">Ky veprim nuk mund të zhbëhet.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-border rounded-lg text-sm font-sans text-muted-foreground hover:text-foreground">Anulo</button>
              <button
                onClick={() => { deleteMutation.mutate({ id: deleteId }); setDeleteId(null); }}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-sans font-semibold hover:bg-red-600"
              >Fshi</button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-card border border-border/50 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm font-sans">Duke ngarkuar...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 text-left">
                <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-sans font-semibold">Artikulli</th>
                <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-sans font-semibold">Vendosja</th>
                <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-sans font-semibold">Statusi</th>
                <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-sans font-semibold">Shikime</th>
                <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-sans font-semibold w-24">Veprime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredArticles.map((a) => (
                <tr key={a.id} className="hover:bg-card/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {a.featuredImage && <img src={a.featuredImage} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                      <span className="text-sm font-medium text-foreground truncate max-w-xs">{a.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {a.homepagePlacement ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-gold/10 text-gold font-sans">
                        {a.homepagePlacement} #{a.homepagePosition}
                      </span>
                    ) : <span className="text-xs text-muted-foreground">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full font-sans ${
                      a.status === "published" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                    }`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-sans">{a.views}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <a href={`/article/${a.slug}`} target="_blank" className="p-1.5 rounded hover:bg-background text-muted-foreground hover:text-foreground">
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      <Link href={`/admin/articles/${a.id}/edit`}>
                        <span className="p-1.5 rounded hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer">
                          <Edit className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                      <button onClick={() => setDeleteId(a.id)} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm font-sans">Duke ngarkuar...</div>
        ) : filteredArticles.map((a) => (
          <div key={a.id} className="bg-card border border-border/50 rounded-xl p-3">
            <div className="flex items-start gap-3">
              {a.featuredImage && (
                <img src={a.featuredImage} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{a.title}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full font-sans ${
                    a.status === "published" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                  }`}>{a.status}</span>
                  <span className="text-[10px] text-muted-foreground font-sans">{a.views} shikime</span>
                  {a.homepagePlacement && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full bg-gold/10 text-gold font-sans">
                      {a.homepagePlacement}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/30">
              <a href={`/article/${a.slug}`} target="_blank" className="flex-1 text-center py-1.5 rounded-lg text-xs font-sans text-muted-foreground hover:text-foreground hover:bg-background border border-border/50">
                Shiko
              </a>
              <Link href={`/admin/articles/${a.id}/edit`}>
                <span className="flex-1 text-center py-1.5 rounded-lg text-xs font-sans text-gold hover:bg-gold/10 border border-gold/30 cursor-pointer px-4">
                  Ndrysho
                </span>
              </Link>
              <button
                onClick={() => setDeleteId(a.id)}
                className="py-1.5 px-3 rounded-lg text-xs font-sans text-red-400 hover:bg-red-500/10 border border-red-500/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
