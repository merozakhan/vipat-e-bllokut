import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { FileText, FolderOpen, Plus, Eye } from "lucide-react";
import AdminLayout from "./AdminLayout";

export default function AdminDashboard() {
  const { data: articles } = trpc.admin.articlesList.useQuery({ limit: 5 });
  const { data: allArticles } = trpc.admin.articlesList.useQuery({ limit: 100 });
  const { data: categories } = trpc.categories.getAllWithCounts.useQuery();

  const totalArticles = allArticles?.length || 0;
  const published = allArticles?.filter(a => a.status === "published").length || 0;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-foreground">Dashboard</h1>
        <Link href="/admin/articles/new">
          <span className="flex items-center gap-2 px-4 py-2 bg-gold text-navy-dark font-bold text-sm rounded-lg hover:bg-gold-light transition-colors cursor-pointer font-sans">
            <Plus className="w-4 h-4" />
            New Article
          </span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{totalArticles}</p>
              <p className="text-xs text-muted-foreground font-sans">Articles</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{published}</p>
              <p className="text-xs text-muted-foreground font-sans">Published</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{categories?.length || 0}</p>
              <p className="text-xs text-muted-foreground font-sans">Categories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Articles */}
      <div className="bg-card border border-border/50 rounded-xl">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Recent Articles</h2>
          <Link href="/admin/articles">
            <span className="text-xs text-gold font-sans cursor-pointer hover:underline">View All</span>
          </Link>
        </div>
        <div className="divide-y divide-border/30">
          {articles?.map((a) => (
            <Link key={a.id} href={`/admin/articles/${a.id}/edit`}>
              <div className="flex items-center gap-4 p-4 hover:bg-card/80 cursor-pointer transition-colors">
                {a.featuredImage && (
                  <img src={a.featuredImage} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground font-sans">
                    {a.categories?.map((c: any) => c?.name).filter(Boolean).join(", ") || "No category"}
                  </p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full font-sans ${
                  a.status === "published" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                }`}>
                  {a.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
