import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Plus, Trash2, Edit, Eye } from "lucide-react";
import { useState } from "react";
import AdminLayout from "./AdminLayout";

export default function AdminArticles() {
  const utils = trpc.useUtils();
  const { data: articles, isLoading } = trpc.admin.articlesList.useQuery({ limit: 100 });
  const deleteMutation = trpc.admin.articlesDelete.useMutation({
    onSuccess: () => utils.admin.articlesList.invalidate(),
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-black text-foreground">Articles</h1>
        <Link href="/admin/articles/new">
          <span className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gold text-navy-dark font-bold text-xs md:text-sm rounded-lg hover:bg-gold-light transition-colors cursor-pointer font-sans">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Article</span>
            <span className="sm:hidden">New</span>
          </span>
        </Link>
      </div>

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-foreground mb-2">Delete Article?</h3>
            <p className="text-sm text-muted-foreground mb-4 font-sans">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-border rounded-lg text-sm font-sans text-muted-foreground hover:text-foreground">Cancel</button>
              <button
                onClick={() => { deleteMutation.mutate({ id: deleteId }); setDeleteId(null); }}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-sans font-semibold hover:bg-red-600"
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-card border border-border/50 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm font-sans">Loading...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 text-left">
                <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-sans font-semibold">Article</th>
                <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-sans font-semibold">Placement</th>
                <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-sans font-semibold">Status</th>
                <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-sans font-semibold">Views</th>
                <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-sans font-semibold w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {articles?.map((a) => (
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
          <div className="p-8 text-center text-muted-foreground text-sm font-sans">Loading...</div>
        ) : articles?.map((a) => (
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
                  <span className="text-[10px] text-muted-foreground font-sans">{a.views} views</span>
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
                View
              </a>
              <Link href={`/admin/articles/${a.id}/edit`}>
                <span className="flex-1 text-center py-1.5 rounded-lg text-xs font-sans text-gold hover:bg-gold/10 border border-gold/30 cursor-pointer px-4">
                  Edit
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
