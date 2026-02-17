import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { Calendar, Clock, Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import ArticleImage from "@/components/ArticleImage";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const { data: category, isLoading: catLoading } = trpc.categories.getBySlug.useQuery({ slug: params.slug || "" });
  const { data: categories } = trpc.categories.getAll.useQuery();
  
  const categoryId = category?.id || categories?.find((c) => c.slug === params.slug)?.id;
  
  const { data: articles, isLoading } = trpc.articles.getByCategory.useQuery(
    { categoryId: categoryId || 0, limit: 30 },
    { enabled: !!categoryId }
  );

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  const shortDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const getReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return `${Math.ceil(words / 200)} min read`;
  };

  const categoryName = category?.name || categories?.find((c) => c.slug === params.slug)?.name || params.slug;

  // Split articles: first one as featured, rest in grid
  const featuredArticle = articles?.[0];
  const gridArticles = articles?.slice(1) || [];

  return (
    <Layout>
      {/* Category Header */}
      <section className="border-b border-border/50">
        <div className="container py-8 md:py-16">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 md:mb-6 text-muted-foreground hover:text-gold font-sans text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              All News
            </Button>
          </Link>
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <div className="w-6 md:w-8 h-[2px] bg-gold" />
            <span className="text-[10px] md:text-xs text-gold uppercase tracking-[0.3em] font-sans font-semibold">Category</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-2 md:mb-4">
            {categoryName}
          </h1>
          {category?.description && (
            <p className="text-sm md:text-lg text-muted-foreground font-sans max-w-2xl">{category.description}</p>
          )}
        </div>
      </section>

      {/* Featured Article for Category */}
      {featuredArticle && (
        <section className="border-b border-border/50">
          <div className="container py-6 md:py-10">
            <Link href={`/article/${featuredArticle.slug}`}>
              <div className="group grid md:grid-cols-2 gap-4 md:gap-8 cursor-pointer">
                <div className="relative aspect-[16/10] md:aspect-[16/11] overflow-hidden rounded-lg md:rounded-xl">
                  <ArticleImage
                    src={featuredArticle.featuredImage}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] md:text-xs text-gold uppercase tracking-wider font-sans font-semibold mb-2 md:mb-3">Latest in {categoryName}</span>
                  <h2 className="text-xl md:text-3xl font-bold text-foreground leading-tight mb-2 md:mb-4 group-hover:text-gold transition-colors line-clamp-3">
                    {featuredArticle.title}
                  </h2>
                  {featuredArticle.excerpt && (
                    <p className="text-sm md:text-base text-muted-foreground font-sans leading-relaxed line-clamp-3 mb-3 md:mb-4">
                      {featuredArticle.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] md:text-xs text-muted-foreground font-sans">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gold/60" />
                      {formatDate(featuredArticle.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gold/60" />
                      {getReadingTime(featuredArticle.content)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="py-8 md:py-16">
        <div className="container">
          {(isLoading || catLoading) ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg md:rounded-xl overflow-hidden border border-border/50">
                  <div className="aspect-[16/10] shimmer" />
                  <div className="p-3 md:p-6 space-y-2 md:space-y-3">
                    <div className="h-3 md:h-4 shimmer rounded w-3/4" />
                    <div className="h-3 md:h-4 shimmer rounded w-full" />
                    <div className="h-2 md:h-3 shimmer rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : gridArticles.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {gridArticles.map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`}>
                  <div className="group bg-card rounded-lg md:rounded-xl overflow-hidden border border-border/50 hover:border-gold/30 transition-all cursor-pointer premium-card h-full flex flex-col">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <ArticleImage
                        src={article.featuredImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        showOverlay
                      />
                    </div>

                    <div className="p-3 md:p-5 flex-1 flex flex-col">
                      <h3 className="text-xs md:text-lg font-bold text-card-foreground mb-1 md:mb-2 leading-snug line-clamp-2 group-hover:text-gold transition-colors">
                        {article.title}
                      </h3>

                      {article.excerpt && (
                        <p className="hidden md:block text-sm text-muted-foreground mb-4 line-clamp-2 flex-1 font-sans leading-relaxed">
                          {article.excerpt}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[9px] md:text-xs text-muted-foreground mt-auto pt-2 md:pt-4 border-t border-border/50 font-sans">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3 text-gold/60" />
                          <span className="hidden sm:inline">{formatDate(article.publishedAt)}</span>
                          <span className="sm:hidden">{shortDate(article.publishedAt)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 text-gold/60" />
                          {getReadingTime(article.content)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : !featuredArticle ? (
            <div className="text-center py-16 md:py-20">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">No Articles Yet</h3>
              <p className="text-sm text-muted-foreground font-sans mb-6">No articles have been published in this category yet.</p>
              <Link href="/">
                <Button className="bg-accent text-accent-foreground hover:bg-gold-dark font-sans text-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </Layout>
  );
}
