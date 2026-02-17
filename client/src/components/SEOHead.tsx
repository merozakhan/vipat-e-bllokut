import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noindex?: boolean;
  articleAuthor?: string;
}

const SITE_NAME = "Vipat E Bllokut";
const DEFAULT_DESCRIPTION = "Portali kryesor i lajmeve shqiptare. Lajme të fundit nga Shqipëria, Kosova dhe bota. Politikë, ekonomi, sport, kulturë, teknologji dhe më shumë.";
const DEFAULT_IMAGE = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663030573139/QipgFkGifGoFtIkn.png";
const SITE_URL = "https://vipatebllokut.com";

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  section,
  tags,
  noindex = false,
  articleAuthor = "Vipat E Bllokut",
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Lajme Shqiptare | Albania News & Media`;
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper to set/update meta tags
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Primary meta
    setMeta("name", "description", description);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");

    // Open Graph
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", fullUrl);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", image);
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height", "630");
    setMeta("property", "og:image:alt", title || SITE_NAME);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:locale", "sq_AL");

    // Twitter Card
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:url", fullUrl);
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);
    setMeta("name", "twitter:image:alt", title || SITE_NAME);

    // Article-specific OG tags
    if (type === "article") {
      if (publishedTime) setMeta("property", "article:published_time", publishedTime);
      if (modifiedTime) setMeta("property", "article:modified_time", modifiedTime);
      if (section) setMeta("property", "article:section", section);
      if (articleAuthor) setMeta("property", "article:author", articleAuthor);
      if (tags) {
        tags.forEach((tag, i) => {
          setMeta("property", `article:tag:${i}`, tag);
        });
      }
    }

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", fullUrl);

    // Add JSON-LD for articles
    if (type === "article" && title) {
      const existingLd = document.querySelector('script[data-seo-article]');
      if (existingLd) existingLd.remove();

      const ldScript = document.createElement("script");
      ldScript.type = "application/ld+json";
      ldScript.setAttribute("data-seo-article", "true");
      ldScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": title,
        "description": description,
        "image": [image],
        "datePublished": publishedTime || new Date().toISOString(),
        "dateModified": modifiedTime || publishedTime || new Date().toISOString(),
        "author": {
          "@type": "Organization",
          "name": "Vipat E Bllokut",
          "url": SITE_URL,
        },
        "publisher": {
          "@type": "Organization",
          "name": "Vipat E Bllokut",
          "logo": {
            "@type": "ImageObject",
            "url": "https://files.manuscdn.com/user_upload_by_module/session_file/310419663030573139/dSMzXKooKwxKipAr.png",
          },
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": fullUrl,
        },
        ...(section ? { "articleSection": section } : {}),
        "inLanguage": "sq",
      });
      document.head.appendChild(ldScript);
    }

    // Cleanup article LD+JSON on unmount
    return () => {
      const ldScript = document.querySelector('script[data-seo-article]');
      if (ldScript) ldScript.remove();
    };
  }, [fullTitle, description, image, fullUrl, type, publishedTime, modifiedTime, section, tags, noindex, articleAuthor, title]);

  return null;
}
