import { useState, useCallback } from "react";
import { Newspaper } from "lucide-react";

interface ArticleImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  aspectRatio?: string;
  showOverlay?: boolean;
}

/**
 * ArticleImage - A robust image component that handles broken/blocked external images
 * with an elegant gradient fallback showing the article title initial and a newspaper icon.
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

  if (!src || hasError) {
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
        src={src}
        alt={alt}
        className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      {showOverlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </>
  );
}
