import { useState, useCallback, useMemo } from "react";
import { Newspaper } from "lucide-react";

interface ArticleImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  aspectRatio?: string;
  showOverlay?: boolean;
}

/**
 * Checks if a URL is already hosted on our own storage (S3/CDN).
 * These URLs can be loaded directly without proxying.
 */
function isOwnHostedUrl(src: string): boolean {
  return (
    src.startsWith("data:") ||
    src.startsWith("/") ||
    src.includes("manus-storage") ||
    src.includes("s3.amazonaws") ||
    src.includes("cloudfront.net") ||
    src.includes("manus.space") ||
    src.includes("forge-api")
  );
}

/**
 * Gets the best URL for loading the image:
 * - S3/CDN images → load directly (fast, reliable)
 * - External images → proxy through our server (bypass hotlink protection)
 */
function getImageUrl(src: string): string {
  if (!src) return "";
  if (isOwnHostedUrl(src)) return src;
  // Proxy external images through our server
  return `/api/image-proxy?url=${encodeURIComponent(src)}`;
}

/**
 * ArticleImage - A robust image component that:
 * 1. Loads S3/CDN images directly (for migrated images - fast!)
 * 2. Proxies external images through our server (for not-yet-migrated images)
 * 3. Shows an elegant gradient fallback if all loading fails
 */
export default function ArticleImage({
  src,
  alt,
  className = "w-full h-full object-cover",
  aspectRatio,
  showOverlay = false,
}: ArticleImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Get first letter of title for the placeholder
  const initial = alt?.charAt(0)?.toUpperCase() || "V";

  // Generate a consistent gradient based on the title
  const gradients = [
    "from-amber-900/80 via-stone-900 to-zinc-900",
    "from-emerald-900/80 via-stone-900 to-zinc-900",
    "from-blue-900/80 via-slate-900 to-zinc-900",
    "from-rose-900/80 via-stone-900 to-zinc-900",
    "from-violet-900/80 via-slate-900 to-zinc-900",
    "from-cyan-900/80 via-slate-900 to-zinc-900",
  ];
  const gradientIndex = alt ? alt.charCodeAt(0) % gradients.length : 0;
  const gradient = gradients[gradientIndex];

  // Get the best URL for loading the image
  const imageUrl = useMemo(() => {
    if (!src) return null;
    return getImageUrl(src);
  }, [src]);

  if (!src || !imageUrl || hasError) {
    return (
      <div className={`relative w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, white 20px, white 21px)`,
        }} />
        {/* Large initial letter */}
        <div className="relative flex flex-col items-center gap-2">
          <span className="text-5xl md:text-6xl font-bold text-white/10 font-serif select-none">
            {initial}
          </span>
          <Newspaper className="w-5 h-5 text-white/20" />
        </div>
        {/* Bottom gradient bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[oklch(0.75_0.15_85)] to-transparent opacity-40" />
      </div>
    );
  }

  return (
    <>
      {/* Shimmer loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 shimmer" />
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
      {showOverlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </>
  );
}
