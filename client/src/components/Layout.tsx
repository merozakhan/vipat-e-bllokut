import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import {
  Search, Menu, X, Instagram, Mail, Phone, MapPin,
  ChevronRight, Globe, Clock, Newspaper,
  Shield, BookOpen, Megaphone, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";

function BreakingNewsTicker() {
  const { data: articles } = trpc.articles.getPublished.useQuery({ limit: 5 });

  if (!articles || articles.length === 0) return null;

  const tickerItems = [...articles, ...articles];

  return (
    <div className="bg-gold/5 border-b border-gold/10 overflow-hidden">
      <div className="container flex items-center">
        <div className="flex-shrink-0 bg-accent text-accent-foreground px-4 py-2 text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-foreground pulse-dot" />
          Lajm i Fundit
        </div>
        <div className="overflow-hidden flex-1 py-2 ml-4">
          <div className="animate-ticker flex whitespace-nowrap">
            {tickerItems.map((article, i) => (
              <Link key={`${article.id}-${i}`} href={`/article/${article.slug}`}>
                <span className="inline-flex items-center text-sm text-foreground/80 hover:text-gold transition-colors mx-8 font-sans">
                  <ChevronRight className="w-3 h-3 mr-1 text-gold" />
                  {article.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const { data: allCategories } = trpc.categories.getAllWithCounts.useQuery();
  const categories = allCategories;
  const trackPageView = trpc.articles.trackPageView.useMutation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    // Real visitor analytics: fire on every SPA route change.
    // Server filters bots and non-SPA paths so admin views don't pollute.
    if (!location.startsWith("/admin")) {
      trackPageView.mutate({ path: location });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ═══════════════ TOP UTILITY BAR ═══════════════ */}
      <div className="bg-[oklch(0.15_0.01_250)] border-b border-white/5 hidden md:block">
        <div className="container">
          <div className="flex items-center justify-between py-2 text-[11px] text-white/50 font-sans">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-gold/60" />
                Manchester, United Kingdom
              </span>
              <span className="w-px h-3 bg-white/10" />
              <a href="tel:+447476921815" className="flex items-center gap-1.5 hover:text-gold transition-colors">
                <Phone className="w-3 h-3 text-gold/60" />
                +44 7476 921815
              </a>
              <span className="w-px h-3 bg-white/10" />
              <a href="mailto:info@vipatebllokut.com" className="flex items-center gap-1.5 hover:text-gold transition-colors">
                <Mail className="w-3 h-3 text-gold/60" />
                info@vipatebllokut.com
              </a>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-gold/60" />
                {new Date().toLocaleDateString("sq-AL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span className="w-px h-3 bg-white/10" />
              <a
                href="https://www.instagram.com/vipat_e_bllokut_al"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ MAIN HEADER ═══════════════ */}
      <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? "bg-background/95 backdrop-blur-xl shadow-lg shadow-black/20" : "bg-background"} border-b border-border/50`}>
        <div className="container">
          <div className="flex items-center justify-between h-20 md:h-24">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-1">
                <img src="/logo.png" alt="Vipat E Bllokut" className="h-14 md:h-18 lg:h-20 w-auto -mr-0.5" />
                <div className="flex flex-col">
                  <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-gradient-gold tracking-tight leading-none">
                    Vipat E Bllokut
                  </h1>
                  <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-sans font-medium mt-0.5">
                    Albania News & Media
                  </p>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {categories?.map((cat) => (
                <Link key={cat.id} href={`/category/${cat.slug}`}>
                  <span
                    className={`px-4 py-2 text-sm font-medium font-sans uppercase tracking-wider transition-colors underline-gold ${
                      location === `/category/${cat.slug}`
                        ? "text-gold"
                        : "text-foreground/70 hover:text-gold"
                    }`}
                  >
                    {cat.name}
                  </span>
                </Link>
              ))}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="ml-2 p-2.5 text-foreground/70 hover:text-gold transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </nav>

            {/* Mobile Controls */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-foreground/70 hover:text-gold transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-foreground/70 hover:text-gold transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="border-t border-border bg-card/95 backdrop-blur-xl animate-fade-in-up">
            <div className="container py-4">
              <form onSubmit={handleSearch} className="flex items-center gap-3 max-w-2xl mx-auto">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Kërko artikuj..."
                    className="w-full pl-12 pr-4 py-3 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm input-premium"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-gold-dark font-sans">
                  Kërko
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card/98 backdrop-blur-xl animate-fade-in-up">
            <div className="container py-4">
              {/* Categories */}
              <div className="space-y-1 mb-4">
                {categories?.map((cat) => (
                  <Link key={cat.id} href={`/category/${cat.slug}`}>
                    <span
                      className={`block px-4 py-3 text-sm font-medium font-sans uppercase tracking-wider rounded-lg transition-colors ${
                        location === `/category/${cat.slug}`
                          ? "text-gold bg-gold/10"
                          : "text-foreground/70 hover:text-gold hover:bg-gold/5"
                      }`}
                    >
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Company & Legal in mobile menu */}
              <div className="border-t border-border/50 pt-3">
                <div className="grid grid-cols-3 gap-1 mb-2">
                  <Link href="/about"><span className="block px-3 py-1.5 text-xs font-sans text-foreground/70 hover:text-gold hover:bg-gold/5 rounded-lg transition-colors">Rreth Nesh</span></Link>
                  <Link href="/advertise"><span className="block px-3 py-1.5 text-xs font-sans text-foreground/70 hover:text-gold hover:bg-gold/5 rounded-lg transition-colors">Reklamoni</span></Link>
                  <Link href="/contact"><span className="block px-3 py-1.5 text-xs font-sans text-foreground/70 hover:text-gold hover:bg-gold/5 rounded-lg transition-colors">Kontakt</span></Link>
                </div>
                <p className="px-3 text-[10px] text-gold/60 uppercase tracking-[0.2em] font-sans font-semibold mb-1.5">Ligjore</p>
                <div className="grid grid-cols-2 gap-0.5 mb-2">
                  <Link href="/privacy-policy"><span className="block px-3 py-1.5 text-xs font-sans text-foreground/60 hover:text-gold rounded-lg transition-colors">Politika e Privatësisë</span></Link>
                  <Link href="/terms"><span className="block px-3 py-1.5 text-xs font-sans text-foreground/60 hover:text-gold rounded-lg transition-colors">Kushtet e Shërbimit</span></Link>
                  <Link href="/gdpr"><span className="block px-3 py-1.5 text-xs font-sans text-foreground/60 hover:text-gold rounded-lg transition-colors">GDPR</span></Link>
                  <Link href="/cookie-policy"><span className="block px-3 py-1.5 text-xs font-sans text-foreground/60 hover:text-gold rounded-lg transition-colors">Politika e Cookies</span></Link>
                  <Link href="/editorial-policy"><span className="block px-3 py-1.5 text-xs font-sans text-foreground/60 hover:text-gold rounded-lg transition-colors">Politika Editoriale</span></Link>
                </div>
                <a
                  href="https://www.instagram.com/vipat_e_bllokut_al"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/70 hover:text-gold font-sans"
                >
                  <Instagram className="w-4 h-4" />
                  Na ndiqni në Instagram
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════ CATEGORY NAVIGATION BAR ═══════════════ */}
      {categories && categories.length > 0 && (
        <div className="border-b border-border/30 bg-card/30">
          <div className="container">
            <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/category/${cat.slug}`}>
                  <span className={`px-4 py-1.5 text-xs font-semibold font-sans uppercase tracking-wider rounded-full transition-all whitespace-nowrap ${
                    location === `/category/${cat.slug}`
                      ? "bg-gold/15 text-gold"
                      : "text-muted-foreground hover:text-gold hover:bg-gold/5"
                  }`}>
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Breaking News Ticker */}
      <BreakingNewsTicker />

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* ═══════════════ PREMIUM FOOTER ═══════════════ */}
      <footer className="bg-[oklch(0.12_0.01_250)]">
        {/* Footer Top Accent */}
        <div className="h-1 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

        {/* Main Footer Content */}
        <div className="container pt-16 pb-12">
          {/* Top Row: Brand + Newsletter CTA */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-12 border-b border-white/8">
            <div className="max-w-md">
              <div className="flex items-center gap-1 mb-2">
                <img src="/logo.png" alt="Vipat E Bllokut" className="h-12 w-auto -mr-0.5" />
                <h3 className="text-2xl font-bold text-gradient-gold">
                  Vipat E Bllokut
                </h3>
              </div>
              <p className="text-sm text-white/40 font-sans leading-relaxed">
                Platforma kryesore dixhitale e lajmeve dhe medias shqiptare. Sjellim të vërtetën, analizën dhe perspektivën për diasporën shqiptare në të gjithë botën që nga viti 2026.
              </p>
            </div>
            <a
              href="https://www.instagram.com/vipat_e_bllokut_al"
              target="_blank"
              rel="noopener noreferrer"
              className="group w-11 h-11 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-gold hover:border-gold/40 hover:bg-gold/5 transition-all"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 pt-12">
            {/* News Categories */}
            <div>
              <h4 className="text-[11px] font-bold text-gold uppercase tracking-[0.2em] mb-5 font-sans flex items-center gap-2">
                <Newspaper className="w-3.5 h-3.5" />
                Kategoritë
              </h4>
              <div className="space-y-3 font-sans">
                {categories?.map((cat) => (
                  <Link key={cat.id} href={`/category/${cat.slug}`}>
                    <span className="block text-[13px] text-white/40 hover:text-gold hover:translate-x-1 transition-all">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-[11px] font-bold text-gold uppercase tracking-[0.2em] mb-5 font-sans flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Kompania
              </h4>
              <div className="space-y-3 font-sans">
                <Link href="/about">
                  <span className="block text-[13px] text-white/40 hover:text-gold hover:translate-x-1 transition-all">
                    Rreth Nesh
                  </span>
                </Link>
                <Link href="/contact">
                  <span className="block text-[13px] text-white/40 hover:text-gold hover:translate-x-1 transition-all">
                    Kontakt
                  </span>
                </Link>
                <Link href="/advertise">
                  <span className="block text-[13px] text-white/40 hover:text-gold hover:translate-x-1 transition-all">
                    Reklamoni
                  </span>
                </Link>
                <Link href="/editorial-policy">
                  <span className="block text-[13px] text-white/40 hover:text-gold hover:translate-x-1 transition-all">
                    Politika Editoriale
                  </span>
                </Link>
              </div>
            </div>

            {/* Legal & Compliance */}
            <div>
              <h4 className="text-[11px] font-bold text-gold uppercase tracking-[0.2em] mb-5 font-sans flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                Ligjore
              </h4>
              <div className="space-y-3 font-sans">
                <Link href="/privacy-policy">
                  <span className="block text-[13px] text-white/40 hover:text-gold hover:translate-x-1 transition-all">
                    Politika e Privatësisë
                  </span>
                </Link>
                <Link href="/terms">
                  <span className="block text-[13px] text-white/40 hover:text-gold hover:translate-x-1 transition-all">
                    Kushtet e Shërbimit
                  </span>
                </Link>
                <Link href="/gdpr">
                  <span className="block text-[13px] text-white/40 hover:text-gold hover:translate-x-1 transition-all">
                    Përputhshmëria GDPR
                  </span>
                </Link>
                <Link href="/cookie-policy">
                  <span className="block text-[13px] text-white/40 hover:text-gold hover:translate-x-1 transition-all">
                    Politika e Cookies
                  </span>
                </Link>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-[11px] font-bold text-gold uppercase tracking-[0.2em] mb-5 font-sans flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                Burime
              </h4>
              <div className="space-y-3 font-sans">
                <Link href="/search">
                  <span className="block text-[13px] text-white/40 hover:text-gold hover:translate-x-1 transition-all">
                    Kërko Artikuj
                  </span>
                </Link>
                <Link href="/editorial-policy">
                  <span className="block text-[13px] text-white/40 hover:text-gold hover:translate-x-1 transition-all">
                    Standardet Editoriale
                  </span>
                </Link>
                <Link href="/advertise">
                  <span className="block text-[13px] text-white/40 hover:text-gold hover:translate-x-1 transition-all">
                    Paketa Mediatike
                  </span>
                </Link>
                <Link href="/contact">
                  <span className="block text-[13px] text-white/40 hover:text-gold hover:translate-x-1 transition-all">
                    Dërgo një Këshillë
                  </span>
                </Link>
              </div>
            </div>

            {/* Contact Info - spans 2 cols on mobile */}
            <div className="col-span-2">
              <h4 className="text-[11px] font-bold text-gold uppercase tracking-[0.2em] mb-5 font-sans flex items-center gap-2">
                <Megaphone className="w-3.5 h-3.5" />
                Na Kontaktoni
              </h4>
              <div className="space-y-4 font-sans">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-gold/70" />
                  </div>
                  <div>
                    <p className="text-[13px] text-white/50 leading-relaxed">
                      Flat 1 Pmb 0512 85 Moss Bank<br />
                      Manchester M8 5AP<br />
                      United Kingdom
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-gold/70" />
                  </div>
                  <a href="tel:+447476921815" className="text-[13px] text-white/50 hover:text-gold transition-colors">
                    +44 7476 921815
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-gold/70" />
                  </div>
                  <a href="mailto:info@vipatebllokut.com" className="text-[13px] text-white/50 hover:text-gold transition-colors">
                    info@vipatebllokut.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-gold/70" />
                  </div>
                  <span className="text-[13px] text-white/50">
                    Nr. Kompanisë: 17079235<br />
                    Regjistruar në Angli dhe Uells
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="border-t border-white/5">
          <div className="container py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <p className="text-[11px] text-white/30 font-sans">
                  &copy; {new Date().getFullYear()} Vipat E Bllokut Ltd. Të gjitha të drejtat e rezervuara.
                </p>
                <span className="hidden sm:block text-white/10">|</span>
                <p className="text-[11px] text-white/20 font-sans">
                  Nr. Regjistrimit: 17079235 | Regjistruar në Angli dhe Uells
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-white/30 font-sans">
                <Link href="/privacy-policy">
                  <span className="hover:text-gold transition-colors">Privatësia</span>
                </Link>
                <Link href="/terms">
                  <span className="hover:text-gold transition-colors">Kushtet</span>
                </Link>
                <Link href="/cookie-policy">
                  <span className="hover:text-gold transition-colors">Cookies</span>
                </Link>
                <Link href="/gdpr">
                  <span className="hover:text-gold transition-colors">GDPR</span>
                </Link>
                <Link href="/editorial-policy">
                  <span className="hover:text-gold transition-colors">Editoriale</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
