import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { Calendar, Clock, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import ArticleImage from "@/components/ArticleImage";
import SEOHead from "@/components/SEOHead";

export default function SearchPage() {
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialQuery = urlParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);

  const { data: articles, isLoading } = trpc.articles.search.useQuery(
    { query: activeQuery, limit: 20 },
    { enabled: activeQuery.length > 0 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveQuery(searchQuery.trim());
      window.history.replaceState(null, "", `/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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

  return (
    <Layout>
      <SEOHead
        title="Kërko Lajme - Search Articles"
        description="Kërkoni artikuj në Vipat E Bllokut. Gjeni lajmet e fundit nga Shqipëria, Kosova dhe bota."
        url="/search"
        noindex={true}
      />
      {/* Search Header */}
      <section className="border-b border-border/50">
        <div className="container py-8 md:py-16">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 md:mb-6 text-muted-foreground hover:text-gold font-sans text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <div className="w-6 md:w-8 h-[2px] bg-gold" />
            <span className="text-[10px] md:text-xs text-gold uppercase tracking-[0.3em] font-sans font-semibold">Search</span>
          </div>
          <h1 className="text-2xl md:text-5xl font-bold text-foreground leading-tight mb-4 md:mb-6">
            {activeQuery ? (
              <>Results for "<span className="text-gradient-gold">{activeQuery}</span>"</>
            ) : (
              "Search Articles"
            )}
          </h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 md:gap-3 max-w-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm"
                autoFocus
              />
            </div>
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-gold-dark font-sans px-4 md:px-6 text-sm">
              Search
            </Button>
          </form>

          {articles && activeQuery && (
            <p className="text-xs md:text-sm text-muted-foreground font-sans mt-3 md:mt-4">
              {articles.length} {articles.length === 1 ? "result" : "results"} found
            </p>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="py-8 md:py-16">
        <div className="container">
          {!activeQuery ? (
            <div className="text-center py-16 md:py-20">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">Start Searching</h3>
              <p className="text-sm text-muted-foreground font-sans">Enter a keyword or topic to find articles.</p>
            </div>
          ) : isLoading ? (
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
          ) : articles && articles.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {articles.map((article) => (
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
          ) : (
            <div className="text-center py-16 md:py-20">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">No Results Found</h3>
              <p className="text-sm text-muted-foreground font-sans mb-6">
                No articles match your search for "{activeQuery}". Try different keywords.
              </p>
              <Link href="/">
                <Button className="bg-accent text-accent-foreground hover:bg-gold-dark font-sans text-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Browse All Articles
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
