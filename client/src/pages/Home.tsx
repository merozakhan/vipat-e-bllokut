import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Calendar, Clock, ArrowRight, TrendingUp, Flame, Star } from "lucide-react";
import Layout from "@/components/Layout";

export default function Home() {
  const { data: articles, isLoading } = trpc.articles.getPublished.useQuery({ limit: 12 });
  const { data: featuredArticle } = trpc.articles.getFeatured.useQuery();

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  const getReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return `${Math.ceil(words / 200)} min read`;
  };

  const otherArticles = articles?.filter((a) => a.id !== featuredArticle?.id) || [];
  const sideArticles = otherArticles.slice(0, 3);
  const gridArticles = otherArticles.slice(3);

  return (
    <Layout>
      {/* Hero Section */}
      {featuredArticle && (
        <section className="border-b border-border/50">
          <div className="container py-8 md:py-12">
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Featured */}
              <div className="lg:col-span-2">
                <Link href={`/article/${featuredArticle.slug}`}>
                  <div className="group relative overflow-hidden rounded-xl cursor-pointer">
                    <div className="aspect-[16/9] overflow-hidden">
                      {featuredArticle.featuredImage ? (
                        <img
                          src={featuredArticle.featuredImage}
                          alt={featuredArticle.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <span className="text-muted-foreground font-sans text-sm">Featured Story</span>
                        </div>
                      )}
                    </div>
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    {/* Content overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-gold text-navy-dark text-xs font-bold uppercase tracking-wider rounded font-sans">
                          Featured
                        </span>
                        <span className="px-3 py-1 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium rounded font-sans">
                          {formatDate(featuredArticle.publishedAt)}
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-3 group-hover:text-gold-light transition-colors">
                        {featuredArticle.title}
                      </h2>
                      {featuredArticle.excerpt && (
                        <p className="text-white/70 text-sm md:text-base leading-relaxed line-clamp-2 font-sans max-w-2xl">
                          {featuredArticle.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-4 text-white/50 text-xs font-sans">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {getReadingTime(featuredArticle.content)}
                        </span>
                        <span className="flex items-center gap-1 text-gold group-hover:text-gold-light transition-colors">
                          Read Full Story
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Side Stories */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-gold" />
                  <h3 className="text-sm font-bold text-gold uppercase tracking-wider font-sans">Top Stories</h3>
                </div>
                {sideArticles.length > 0 ? (
                  sideArticles.map((article, index) => (
                    <Link key={article.id} href={`/article/${article.slug}`}>
                      <div className="group flex gap-4 p-4 bg-card rounded-lg border border-border/50 hover:border-gold/30 transition-all cursor-pointer premium-card">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-gold font-bold text-lg font-sans">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-gold transition-colors">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-sans">
                            <span>{formatDate(article.publishedAt)}</span>
                            <span>{getReadingTime(article.content)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm font-sans">
                    More stories coming soon
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Editorial Picks / Latest News */}
      <section className="py-12 md:py-16">
        <div className="container">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gold rounded-full" />
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Latest News</h2>
                <p className="text-xs text-muted-foreground font-sans mt-1 uppercase tracking-wider">Stay informed with our latest coverage</p>
              </div>
            </div>
          </div>

          {isLoading ? (
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
          ) : gridArticles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridArticles.map((article) => (
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
          ) : !featuredArticle ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No Articles Yet</h3>
              <p className="text-muted-foreground font-sans">Fresh content is on its way. Check back soon.</p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Newsletter / CTA Section */}
      <section className="py-16 border-t border-border/50">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-[2px] bg-gold mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Stay Connected
            </h2>
            <p className="text-muted-foreground font-sans mb-6">
              Follow us on Instagram for real-time updates, behind-the-scenes content, and breaking news from Albania.
            </p>
            <a
              href="https://www.instagram.com/vipat_e_bllokut_al"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-navy-dark font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-gold-light transition-colors font-sans"
            >
              Follow @vipat_e_bllokut_al
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
