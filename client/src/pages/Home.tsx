import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Calendar, Clock, ArrowRight, TrendingUp, Flame, Zap, ChevronRight, Eye } from "lucide-react";
import Layout from "@/components/Layout";
import ArticleImage from "@/components/ArticleImage";
import SEOHead from "@/components/SEOHead";

export default function Home() {
  // Placement-based queries
  const { data: breakingArticles } = trpc.articles.getByPlacement.useQuery({ placement: "breaking", limit: 3 });
  const { data: trendingArticles } = trpc.articles.getByPlacement.useQuery({ placement: "trending", limit: 5 });
  const { data: hotArticles } = trpc.articles.getByPlacement.useQuery({ placement: "hot", limit: 4 });
  const { data: mostReadArticles } = trpc.articles.getByPlacement.useQuery({ placement: "most_read", limit: 5 });

  // Fallback: auto-trending by engagement score
  const { data: autoTrending } = trpc.articles.getTrending.useQuery({ limit: 8 });
  const { data: latestArticles, isLoading } = trpc.articles.getPublished.useQuery({ limit: 20 });

  // Use placement articles if available, otherwise fallback to auto-trending
  const heroArticle = breakingArticles?.[0] || autoTrending?.[0];
  const secondaryHero = breakingArticles?.slice(1, 3) || [];
  const trendingList = (trendingArticles?.length ? trendingArticles : autoTrending?.slice(1, 6)) || [];
  const hotList = (hotArticles?.length ? hotArticles : autoTrending?.slice(1, 3)) || [];
  const mostReadList = (mostReadArticles?.length ? mostReadArticles : autoTrending?.slice(3, 8)) || [];

  // Latest articles excluding those already shown
  const shownIds = new Set([
    heroArticle?.id,
    ...secondaryHero.map(a => a.id),
    ...trendingList.map(a => a.id),
    ...hotList.map(a => a.id),
    ...mostReadList.map(a => a.id),
  ].filter(Boolean));
  const filteredLatest = latestArticles?.filter(a => !shownIds.has(a.id)) || [];

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  const formatDateShort = (date: Date | string | null) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const getReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return `${Math.ceil(words / 200)} min`;
  };

  const getTimeAgo = (date: Date | string | null) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Tani";
    if (hours < 24) return `${hours}h më parë`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Dje";
    return `${days} ditë më parë`;
  };

  return (
    <Layout>
      <SEOHead
        title="Lajme Shqiptare - Albania News & Media"
        description="Portali kryesor i lajmeve shqiptare. Lajme të fundit nga Shqipëria, Kosova dhe bota. Politikë, ekonomi, sport, kulturë, teknologji dhe më shumë."
        url="/"
      />

      {/* ═══ HERO: Breaking / Top Article ═══ */}
      {heroArticle && (
        <section className="border-b border-red-900/30">
          <div className="container py-4 md:py-8">
            <div className="grid lg:grid-cols-12 gap-4 lg:gap-6">
              {/* Main Hero */}
              <div className="lg:col-span-8">
                <Link href={`/article/${heroArticle.slug}`}>
                  <div className="group relative overflow-hidden rounded-xl cursor-pointer">
                    <div className="aspect-[16/9] md:aspect-[2/1] overflow-hidden relative">
                      <ArticleImage
                        src={heroArticle.featuredImage}
                        alt={heroArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
                      <div className="flex items-center gap-2 mb-2 md:mb-3">
                        {breakingArticles?.length ? (
                          <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] md:text-xs font-bold uppercase tracking-wider rounded animate-pulse font-sans">
                            <Zap className="w-3 h-3 inline mr-1" />
                            Breaking
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] md:text-xs font-bold uppercase tracking-wider rounded animate-pulse font-sans">
                            <Flame className="w-3 h-3 inline mr-1" />
                            Trending
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-white/10 backdrop-blur-sm text-white/90 text-[10px] md:text-xs font-medium rounded font-sans">
                          {getTimeAgo(heroArticle.publishedAt)}
                        </span>
                      </div>
                      <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-white leading-tight mb-2 md:mb-3 group-hover:text-gold-light transition-colors line-clamp-3">
                        {heroArticle.title}
                      </h1>
                      <div className="flex items-center gap-4 mt-2 md:mt-4 text-white/50 text-[10px] md:text-xs font-sans">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getReadingTime(heroArticle.content)}
                        </span>
                        <span className="flex items-center gap-1 text-red-400 group-hover:text-red-300 transition-colors font-semibold">
                          Lexo Tani
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Secondary Hero / Hot Articles */}
                {hotList.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mt-3 md:mt-4">
                    {hotList.slice(0, 2).map((article) => (
                      <Link key={article.id} href={`/article/${article.slug}`}>
                        <div className="group relative overflow-hidden rounded-lg cursor-pointer">
                          <div className="aspect-[16/9] overflow-hidden relative">
                            <ArticleImage
                              src={article.featuredImage}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                            <span className="px-1.5 py-0.5 bg-orange-600/80 text-white text-[8px] md:text-[10px] font-bold uppercase tracking-wider rounded font-sans mb-1 inline-block">
                              <Flame className="w-2.5 h-2.5 inline mr-0.5" />
                              Hot
                            </span>
                            <h3 className="text-xs md:text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-gold-light transition-colors">
                              {article.title}
                            </h3>
                            <span className="text-[9px] md:text-[10px] text-white/50 font-sans mt-1 block">
                              {getTimeAgo(article.publishedAt)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar: Më Të Lexuarat */}
              <div className="lg:col-span-4">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <div className="w-1 h-6 bg-red-600 rounded-full" />
                  <Eye className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider font-sans">Më Të Lexuarat</h3>
                </div>
                <div className="flex flex-col gap-2 md:gap-3">
                  {mostReadList.map((article, index) => (
                    <Link key={article.id} href={`/article/${article.slug}`}>
                      <div className="group flex gap-3 p-2.5 md:p-3 bg-card/50 rounded-lg border border-border/30 hover:border-red-600/40 hover:bg-card transition-all cursor-pointer">
                        <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-red-600/10 border border-red-600/30 flex items-center justify-center">
                          <span className="text-red-500 font-black text-sm md:text-base font-sans">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs md:text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-[9px] md:text-[10px] text-muted-foreground font-sans">
                            <span>{getTimeAgo(article.publishedAt)}</span>
                            <span className="text-red-500/60">•</span>
                            <span>{getReadingTime(article.content)}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded overflow-hidden hidden sm:block">
                          <ArticleImage
                            src={article.featuredImage}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ TRENDING Section ═══ */}
      {trendingList.length > 0 && (
        <section className="py-6 md:py-10 border-b border-border/30">
          <div className="container">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <div className="w-1 h-7 bg-purple-500 rounded-full" />
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
              <h2 className="text-lg md:text-2xl font-black text-foreground">Trending</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
              {trendingList.slice(0, 4).map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`}>
                  <div className="group bg-card/50 rounded-lg overflow-hidden border border-border/30 hover:border-purple-500/30 transition-all cursor-pointer h-full flex flex-col">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <ArticleImage
                        src={article.featuredImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        showOverlay
                      />
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-purple-600/80 text-white text-[8px] font-bold uppercase tracking-wider rounded font-sans">
                        <TrendingUp className="w-2.5 h-2.5 inline mr-0.5" />
                        Trending
                      </span>
                    </div>
                    <div className="p-2.5 md:p-4 flex-1 flex flex-col">
                      <h3 className="text-xs md:text-sm font-bold text-card-foreground leading-snug line-clamp-2 group-hover:text-purple-400 transition-colors">
                        {article.title}
                      </h3>
                      <div className="flex items-center justify-between text-[9px] md:text-[10px] text-muted-foreground mt-auto pt-2 border-t border-border/30 font-sans">
                        <span>{getTimeAgo(article.publishedAt)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-purple-500/50" />
                          {getReadingTime(article.content)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ LATEST NEWS Grid ═══ */}
      <section className="py-6 md:py-12">
        <div className="container">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-7 bg-gold rounded-full" />
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gold" />
              <h2 className="text-lg md:text-2xl font-black text-foreground">Lajmet e Fundit</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg overflow-hidden border border-border/30">
                  <div className="aspect-[16/10] shimmer" />
                  <div className="p-3 md:p-5 space-y-2">
                    <div className="h-3 shimmer rounded w-3/4" />
                    <div className="h-3 shimmer rounded w-full" />
                    <div className="h-2 shimmer rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLatest.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
              {filteredLatest.map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`}>
                  <div className="group bg-card/50 rounded-lg overflow-hidden border border-border/30 hover:border-gold/30 transition-all cursor-pointer h-full flex flex-col">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <ArticleImage
                        src={article.featuredImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        showOverlay
                      />
                    </div>
                    <div className="p-2.5 md:p-4 flex-1 flex flex-col">
                      <h3 className="text-xs md:text-sm font-bold text-card-foreground leading-snug line-clamp-2 group-hover:text-gold transition-colors">
                        {article.title}
                      </h3>
                      <div className="flex items-center justify-between text-[9px] md:text-[10px] text-muted-foreground mt-auto pt-2 border-t border-border/30 font-sans">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-gold/50" />
                          <span className="hidden sm:inline">{formatDate(article.publishedAt)}</span>
                          <span className="sm:hidden">{formatDateShort(article.publishedAt)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-gold/50" />
                          {getReadingTime(article.content)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-2">Asnjë Lajm Akoma</h3>
              <p className="text-muted-foreground font-sans text-sm">Lajmet e reja po vijnë së shpejti.</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ CTA Section ═══ */}
      <section className="py-10 md:py-14 border-t border-border/30">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-[2px] bg-gold mx-auto mb-5" />
            <h2 className="text-lg md:text-2xl font-black text-foreground mb-3">
              Na Ndiqni
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground font-sans mb-5">
              Ndiqni në Instagram për lajme në kohë reale, përmbajtje ekskluzive dhe lajme të fundit nga Shqipëria.
            </p>
            <a
              href="https://www.instagram.com/vipat_e_bllokut_al"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold text-navy-dark font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-gold-light transition-colors font-sans"
            >
              Na Ndiqni @vipat_e_bllokut_al
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
