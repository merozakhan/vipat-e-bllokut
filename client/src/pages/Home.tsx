import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Calendar, Clock, ArrowRight, TrendingUp, Flame, Zap, Globe, Shield, ChevronRight } from "lucide-react";
import Layout from "@/components/Layout";
import ArticleImage from "@/components/ArticleImage";
import SEOHead from "@/components/SEOHead";

export default function Home() {
  const { data: trendingArticles, isLoading: trendingLoading } = trpc.articles.getTrending.useQuery({ limit: 8 });
  const { data: latestArticles, isLoading: latestLoading } = trpc.articles.getPublished.useQuery({ limit: 20 });
  const { data: politikeArticles } = trpc.articles.getByCategorySlug.useQuery({ slug: "politike", limit: 6 });
  const { data: boteArticles } = trpc.articles.getByCategorySlug.useQuery({ slug: "bote", limit: 6 });

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

  // Hero = top trending article
  const heroArticle = trendingArticles?.[0];
  // Secondary trending (next 2)
  const secondaryTrending = trendingArticles?.slice(1, 3) || [];
  // Sidebar trending (next 5)
  const sidebarTrending = trendingArticles?.slice(3, 8) || [];

  // Latest articles excluding those already shown in trending
  const trendingIds = new Set(trendingArticles?.map(a => a.id) || []);
  const filteredLatest = latestArticles?.filter(a => !trendingIds.has(a.id)) || [];

  return (
    <Layout>
      <SEOHead
        title="Lajme Shqiptare - Albania News & Media"
        description="Portali kryesor i lajmeve shqiptare. Lajme të fundit nga Shqipëria, Kosova dhe bota. Politikë, ekonomi, sport, kulturë, teknologji dhe më shumë."
        url="/"
      />
      {/* ═══ HERO: Most Controversial Article ═══ */}
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
                        <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] md:text-xs font-bold uppercase tracking-wider rounded animate-pulse font-sans">
                          <Flame className="w-3 h-3 inline mr-1" />
                          Trending
                        </span>
                        <span className="px-2 py-0.5 bg-white/10 backdrop-blur-sm text-white/90 text-[10px] md:text-xs font-medium rounded font-sans">
                          {getTimeAgo(heroArticle.publishedAt)}
                        </span>
                      </div>
                      <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-white leading-tight mb-2 md:mb-3 group-hover:text-gold-light transition-colors line-clamp-3">
                        {heroArticle.title}
                      </h1>
                      {heroArticle.excerpt && (
                        <p className="hidden md:block text-white/70 text-sm md:text-base leading-relaxed line-clamp-2 font-sans max-w-3xl">
                          {heroArticle.excerpt}
                        </p>
                      )}
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

                {/* Secondary Trending - 2 cards below hero */}
                {secondaryTrending.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mt-3 md:mt-4">
                    {secondaryTrending.map((article) => (
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
                            <span className="px-1.5 py-0.5 bg-red-600/80 text-white text-[8px] md:text-[10px] font-bold uppercase tracking-wider rounded font-sans mb-1 inline-block">
                              <Zap className="w-2.5 h-2.5 inline mr-0.5" />
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

              {/* Sidebar: Trending List */}
              <div className="lg:col-span-4">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <div className="w-1 h-6 bg-red-600 rounded-full" />
                  <Flame className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider font-sans">Më Të Lexuarat</h3>
                </div>
                <div className="flex flex-col gap-2 md:gap-3">
                  {sidebarTrending.map((article, index) => (
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
                        {/* Small thumbnail */}
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

      {/* ═══ POLITIKË Spotlight ═══ */}
      {politikeArticles && politikeArticles.length > 0 && (
        <section className="py-6 md:py-10 border-b border-border/30">
          <div className="container">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-7 bg-gold rounded-full" />
                <Shield className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                <h2 className="text-lg md:text-2xl font-black text-foreground">Politikë</h2>
              </div>
              <Link href="/category/politike">
                <span className="text-xs md:text-sm text-gold hover:text-gold-light font-semibold font-sans flex items-center gap-1 cursor-pointer">
                  Shiko Të Gjitha <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
              {/* First article large */}
              {politikeArticles[0] && (
                <Link href={`/article/${politikeArticles[0].slug}`} className="col-span-2 lg:col-span-1 lg:row-span-2">
                  <div className="group relative overflow-hidden rounded-xl cursor-pointer h-full">
                    <div className="aspect-[16/9] lg:aspect-auto lg:h-full overflow-hidden relative">
                      <ArticleImage
                        src={politikeArticles[0].featuredImage}
                        alt={politikeArticles[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                      <span className="px-2 py-0.5 bg-gold/90 text-navy-dark text-[9px] md:text-[10px] font-bold uppercase tracking-wider rounded font-sans mb-2 inline-block">
                        Politikë
                      </span>
                      <h3 className="text-sm md:text-xl font-bold text-white leading-snug line-clamp-3 group-hover:text-gold-light transition-colors">
                        {politikeArticles[0].title}
                      </h3>
                      <span className="text-[9px] md:text-xs text-white/50 font-sans mt-2 block">
                        {getTimeAgo(politikeArticles[0].publishedAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              )}
              {/* Remaining politics articles */}
              {politikeArticles.slice(1, 5).map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`}>
                  <div className="group flex flex-col bg-card/50 rounded-lg border border-border/30 hover:border-gold/30 overflow-hidden cursor-pointer h-full transition-all">
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <ArticleImage
                        src={article.featuredImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        showOverlay
                      />
                    </div>
                    <div className="p-2.5 md:p-4 flex-1 flex flex-col">
                      <h4 className="text-xs md:text-sm font-bold text-card-foreground leading-snug line-clamp-2 group-hover:text-gold transition-colors">
                        {article.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-auto pt-2 text-[9px] md:text-[10px] text-muted-foreground font-sans">
                        <span>{getTimeAgo(article.publishedAt)}</span>
                        <span className="text-gold/40">•</span>
                        <span>{getReadingTime(article.content)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ BOTË (World News) ═══ */}
      {boteArticles && boteArticles.length > 0 && (
        <section className="py-6 md:py-10 border-b border-border/30">
          <div className="container">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-7 bg-blue-500 rounded-full" />
                <Globe className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                <h2 className="text-lg md:text-2xl font-black text-foreground">Botë</h2>
              </div>
              <Link href="/category/bote">
                <span className="text-xs md:text-sm text-blue-400 hover:text-blue-300 font-semibold font-sans flex items-center gap-1 cursor-pointer">
                  Shiko Të Gjitha <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>

            {/* World news horizontal scroll on mobile, grid on desktop */}
            <div className="flex gap-3 md:gap-5 overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-3 md:overflow-visible scrollbar-hide">
              {boteArticles.slice(0, 6).map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`} className="flex-shrink-0 w-[70vw] md:w-auto">
                  <div className="group flex flex-col bg-card/50 rounded-lg border border-border/30 hover:border-blue-500/30 overflow-hidden cursor-pointer h-full transition-all">
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <ArticleImage
                        src={article.featuredImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        showOverlay
                      />
                      <div className="absolute top-2 left-2">
                        <span className="px-1.5 py-0.5 bg-blue-600/80 text-white text-[8px] md:text-[9px] font-bold uppercase tracking-wider rounded font-sans">
                          Botë
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5 md:p-4 flex-1 flex flex-col">
                      <h4 className="text-xs md:text-sm font-bold text-card-foreground leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {article.title}
                      </h4>
                      {article.excerpt && (
                        <p className="hidden md:block text-xs text-muted-foreground mt-1.5 line-clamp-2 font-sans leading-relaxed">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-auto pt-2 text-[9px] md:text-[10px] text-muted-foreground font-sans">
                        <span>{getTimeAgo(article.publishedAt)}</span>
                        <span className="text-blue-500/40">•</span>
                        <span>{getReadingTime(article.content)}</span>
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
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-gold" />
              <h2 className="text-lg md:text-2xl font-black text-foreground">Lajmet e Fundit</h2>
            </div>
          </div>

          {latestLoading || trendingLoading ? (
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
                      {article.excerpt && (
                        <p className="hidden md:block text-xs text-muted-foreground mt-1.5 line-clamp-2 font-sans leading-relaxed flex-1">
                          {article.excerpt}
                        </p>
                      )}
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
