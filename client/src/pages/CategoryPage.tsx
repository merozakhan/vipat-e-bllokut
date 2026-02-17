import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { Calendar, Clock, Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const { data: category, isLoading: catLoading } = trpc.categories.getBySlug.useQuery({ slug: params.slug || "" });
  const { data: categories } = trpc.categories.getAll.useQuery();
  
  // Find category ID from slug
  const categoryId = category?.id || categories?.find((c) => c.slug === params.slug)?.id;
  
  const { data: articles, isLoading } = trpc.articles.getByCategory.useQuery(
    { categoryId: categoryId || 0, limit: 20 },
    { enabled: !!categoryId }
  );

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  const getReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return `${Math.ceil(words / 200)} min read`;
  };

  const categoryName = category?.name || categories?.find((c) => c.slug === params.slug)?.name || params.slug;

  return (
    <Layout>
      {/* Category Header */}
      <section className="border-b border-border/50">
        <div className="container py-12 md:py-16">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground hover:text-gold font-sans">
              <ArrowLeft className="w-4 h-4 mr-2" />
              All News
            </Button>
          </Link>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-[2px] bg-gold" />
            <span className="text-xs text-gold uppercase tracking-[0.3em] font-sans font-semibold">Category</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
            {categoryName}
          </h1>
          {category?.description && (
            <p className="text-lg text-muted-foreground font-sans max-w-2xl">{category.description}</p>
          )}
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-12 md:py-16">
        <div className="container">
          {(isLoading || catLoading) ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl overflow-hidden border border-border/50">
                  <div className="aspect-[16/10] shimmer" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 shimmer rounded w-3/4" />
                    <div className="h-4 shimmer rounded w-full" />
                    <div className="h-3 shimmer rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`}>
                  <div className="group bg-card rounded-xl overflow-hidden border border-border/50 hover:border-gold/30 transition-all cursor-pointer premium-card h-full flex flex-col">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {article.featuredImage ? (
                        <img
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <Star className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-card-foreground mb-2 leading-snug line-clamp-2 group-hover:text-gold transition-colors">
                        {article.title}
                      </h3>

                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1 font-sans leading-relaxed">
                          {article.excerpt}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50 font-sans">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-gold/60" />
                          {formatDate(article.publishedAt)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-gold/60" />
                          {getReadingTime(article.content)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No Articles Yet</h3>
              <p className="text-muted-foreground font-sans mb-6">No articles have been published in this category yet.</p>
              <Link href="/">
                <Button className="bg-accent text-accent-foreground hover:bg-gold-dark font-sans">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
