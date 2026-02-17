import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { Calendar, Clock, ArrowLeft, Share2, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

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
        <div className="container py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-4 shimmer rounded w-24" />
            <div className="h-12 shimmer rounded w-3/4" />
            <div className="h-4 shimmer rounded w-1/3" />
            <div className="aspect-[16/9] shimmer rounded-xl" />
            <div className="space-y-4 pt-4">
              <div className="h-4 shimmer rounded" />
              <div className="h-4 shimmer rounded" />
              <div className="h-4 shimmer rounded w-5/6" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="container py-20">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
              <Star className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3">Article Not Found</h2>
            <p className="text-muted-foreground font-sans mb-8">The article you are looking for does not exist or has been removed.</p>
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

  // Split content into paragraphs for better rendering
  const paragraphs = article.content.split("\n\n").filter((p) => p.trim());

  return (
    <Layout>
      <article>
        {/* Article Header */}
        <div className="border-b border-border/50">
          <div className="container py-8 md:py-12">
            <div className="max-w-4xl mx-auto">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans mb-6">
                <Link href="/">
                  <span className="hover:text-gold transition-colors">Home</span>
                </Link>
                <ChevronRight className="w-3 h-3" />
                {article.categories && article.categories.length > 0 && (
                  <>
                    <Link href={`/category/${article.categories?.[0]?.slug}`}>
                      <span className="hover:text-gold transition-colors">{article.categories?.[0]?.name}</span>
                    </Link>
                    <ChevronRight className="w-3 h-3" />
                  </>
                )}
                <span className="text-foreground/50 truncate">{article.title}</span>
              </div>

              {/* Categories */}
              {article.categories && article.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.categories.map((category: any) => (
                    <Link key={category.id} href={`/category/${category.slug}`}>
                      <span className="px-3 py-1 bg-gold/15 text-gold text-xs font-bold uppercase tracking-wider rounded font-sans hover:bg-gold/25 transition-colors">
                        {category.name}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                {article.title}
              </h1>

              {/* Excerpt */}
              {article.excerpt && (
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6 font-sans">
                  {article.excerpt}
                </p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-sans">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gold/60" />
                  {formatDate(article.publishedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gold/60" />
                  {getReadingTime(article.content)}
                </span>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareArticle}
                  className="border-border/50 text-muted-foreground hover:text-gold hover:border-gold/30 font-sans"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {article.featuredImage && (
          <div className="container py-8">
            <div className="max-w-4xl mx-auto">
              <div className="rounded-xl overflow-hidden border border-border/30">
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        )}

        {/* Article Body */}
        <div className="container pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="border-l-2 border-gold/20 pl-6 md:pl-10">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-foreground/85 text-base md:text-lg leading-relaxed mb-6 font-sans"
                >
                  {paragraph.trim()}
                </p>
              ))}
            </div>

            {/* Article Footer */}
            <div className="mt-12 pt-8 border-t border-border/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-sans uppercase tracking-wider mb-1">Published</p>
                  <p className="text-sm text-foreground font-sans">{formatDate(article.publishedAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareArticle}
                    className="border-gold/30 text-gold hover:bg-gold/10 font-sans"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Article
                  </Button>
                  <Link href="/">
                    <Button variant="outline" size="sm" className="border-border/50 text-muted-foreground hover:text-foreground font-sans">
                      <ArrowLeft className="w-4 h-4 mr-2" />
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
          <div className="border-t border-border/50 bg-card/30 py-12 md:py-16">
            <div className="container">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-8 bg-gold rounded-full" />
                <h2 className="text-2xl font-bold text-foreground">More Stories</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedArticles.map((related) => (
                  <Link key={related.id} href={`/article/${related.slug}`}>
                    <div className="group bg-card rounded-xl overflow-hidden border border-border/50 hover:border-gold/30 transition-all cursor-pointer premium-card">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        {related.featuredImage ? (
                          <img
                            src={related.featuredImage}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full bg-secondary flex items-center justify-center">
                            <Star className="w-6 h-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="text-base font-bold text-card-foreground leading-snug line-clamp-2 group-hover:text-gold transition-colors">
                          {related.title}
                        </h3>
                        <p className="text-xs text-muted-foreground font-sans mt-3">
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
