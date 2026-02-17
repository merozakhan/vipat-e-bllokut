import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { Calendar, Clock, ArrowLeft, Share2, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import ArticleImage from "@/components/ArticleImage";
import SEOHead from "@/components/SEOHead";

export default function ArticleDetail() {
  const params = useParams<{ slug: string }>();
  const { data: article, isLoading } = trpc.articles.getBySlug.useQuery({ slug: params.slug || "" });
  const { data: latestArticles } = trpc.articles.getPublished.useQuery({ limit: 4 });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  const getReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return `${Math.ceil(words / 200)} min read`;
  };

  const shareArticle = () => {
    if (navigator.share && article) {
      navigator.share({
        title: article.title,
        text: article.excerpt || "",
        url: window.location.href,
      });
    } else if (article) {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const relatedArticles = latestArticles?.filter((a) => a.slug !== params.slug).slice(0, 3) || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 md:py-12">
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
            <div className="h-3 md:h-4 shimmer rounded w-24" />
            <div className="h-8 md:h-12 shimmer rounded w-3/4" />
            <div className="h-3 md:h-4 shimmer rounded w-1/3" />
            <div className="aspect-[16/9] shimmer rounded-lg md:rounded-xl" />
            <div className="space-y-3 md:space-y-4 pt-4">
              <div className="h-3 md:h-4 shimmer rounded" />
              <div className="h-3 md:h-4 shimmer rounded" />
              <div className="h-3 md:h-4 shimmer rounded w-5/6" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="container py-16 md:py-20">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Star className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 md:mb-3">Article Not Found</h2>
            <p className="text-sm md:text-base text-muted-foreground font-sans mb-6 md:mb-8">The article you are looking for does not exist or has been removed.</p>
            <Link href="/">
              <Button className="bg-accent text-accent-foreground hover:bg-gold-dark font-sans">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title={article.title}
        description={article.excerpt || article.content.substring(0, 160).replace(/<[^>]*>/g, '')}
        image={article.featuredImage || undefined}
        url={`/article/${article.slug}`}
        type="article"
        publishedTime={article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined}
        section={article.categories?.[0]?.name}
        tags={article.categories?.map((c: any) => c.name)}
      />
      <article>
        {/* Article Header */}
        <div className="border-b border-border/50">
          <div className="container py-6 md:py-12">
            <div className="max-w-4xl mx-auto">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-muted-foreground font-sans mb-4 md:mb-6 overflow-x-auto">
                <Link href="/">
                  <span className="hover:text-gold transition-colors whitespace-nowrap">Home</span>
                </Link>
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
                {article.categories && article.categories.length > 0 && (
                  <>
                    <Link href={`/category/${article.categories?.[0]?.slug}`}>
                      <span className="hover:text-gold transition-colors whitespace-nowrap">{article.categories?.[0]?.name}</span>
                    </Link>
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  </>
                )}
                <span className="text-foreground/50 truncate">{article.title}</span>
              </div>

              {/* Categories */}
              {article.categories && article.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
                  {article.categories.map((category: any) => (
                    <Link key={category.id} href={`/category/${category.slug}`}>
                      <span className="px-2 md:px-3 py-0.5 md:py-1 bg-gold/15 text-gold text-[10px] md:text-xs font-bold uppercase tracking-wider rounded font-sans hover:bg-gold/25 transition-colors">
                        {category.name}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 md:mb-6 leading-tight">
                {article.title}
              </h1>

              {/* Excerpt */}
              {article.excerpt && (
                <p className="text-base md:text-xl text-muted-foreground leading-relaxed mb-4 md:mb-6 font-sans">
                  {article.excerpt}
                </p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground font-sans">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-gold/60" />
                  {formatDate(article.publishedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-gold/60" />
                  {getReadingTime(article.content)}
                </span>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareArticle}
                  className="border-border/50 text-muted-foreground hover:text-gold hover:border-gold/30 font-sans text-xs"
                >
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {article.featuredImage && (
          <div className="container py-4 md:py-8">
            <div className="max-w-4xl mx-auto">
              <div className="rounded-lg md:rounded-xl overflow-hidden border border-border/30 relative aspect-[16/9]">
                <ArticleImage
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* Article Body */}
        <div className="container pb-12 md:pb-16">
          <div className="max-w-4xl mx-auto">
            <div
              className="article-content border-l-2 border-gold/20 pl-4 md:pl-10 text-foreground/85 text-[15px] md:text-lg leading-relaxed font-sans"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Article Footer */}
            <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-border/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] md:text-xs text-muted-foreground font-sans uppercase tracking-wider mb-1">Published</p>
                  <p className="text-xs md:text-sm text-foreground font-sans">{formatDate(article.publishedAt)}</p>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareArticle}
                    className="border-gold/30 text-gold hover:bg-gold/10 font-sans text-xs"
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1.5" />
                    Share
                  </Button>
                  <Link href="/">
                    <Button variant="outline" size="sm" className="border-border/50 text-muted-foreground hover:text-foreground font-sans text-xs">
                      <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                      Back to News
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="border-t border-border/50 bg-card/30 py-8 md:py-16">
            <div className="container">
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <div className="w-1 h-6 md:h-8 bg-gold rounded-full" />
                <h2 className="text-xl md:text-2xl font-bold text-foreground">More Stories</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                {relatedArticles.map((related) => (
                  <Link key={related.id} href={`/article/${related.slug}`}>
                    <div className="group bg-card rounded-lg md:rounded-xl overflow-hidden border border-border/50 hover:border-gold/30 transition-all cursor-pointer premium-card">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <ArticleImage
                          src={related.featuredImage}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          showOverlay
                        />
                      </div>
                      <div className="p-3 md:p-5">
                        <h3 className="text-xs md:text-base font-bold text-card-foreground leading-snug line-clamp-2 group-hover:text-gold transition-colors">
                          {related.title}
                        </h3>
                        <p className="text-[10px] md:text-xs text-muted-foreground font-sans mt-2 md:mt-3">
                          {formatDate(related.publishedAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </article>
    </Layout>
  );
}
