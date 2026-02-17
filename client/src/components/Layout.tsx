import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Search, Menu, X, Instagram, Mail, Phone, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function BreakingNewsTicker() {
  const { data: articles } = trpc.articles.getPublished.useQuery({ limit: 5 });

  if (!articles || articles.length === 0) return null;

  const tickerItems = [...articles, ...articles]; // duplicate for seamless loop

  return (
    <div className="bg-gold/10 border-b border-gold/20 overflow-hidden">
      <div className="container flex items-center">
        <div className="flex-shrink-0 bg-accent text-accent-foreground px-4 py-2 text-xs font-bold uppercase tracking-widest font-sans">
          Breaking
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
  const { data: categories } = trpc.categories.getAll.useQuery();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="bg-navy-dark border-b border-border/50 hidden md:block">
        <div className="container">
          <div className="flex items-center justify-between py-2 text-xs text-muted-foreground font-sans">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-gold" />
                London, United Kingdom
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-gold" />
                +44 7476 921815
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-gold" />
                info@vipatebllokut.com
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
              <a
                href="https://www.instagram.com/vipat_e_bllokut_al"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur-md shadow-lg shadow-black/20" : "bg-background"} border-b border-border`}>
        <div className="container">
          <div className="flex items-center justify-between h-20 md:h-24">
            {/* Logo */}
            <Link href="/">
              <div className="flex flex-col items-start">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gradient-gold tracking-tight leading-none">
                  Vipat E Bllokut
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-8 h-[1px] bg-gold/60" />
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-[0.3em] font-sans font-medium">
                    Albania News & Media
                  </p>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`px-4 py-2 text-sm font-medium font-sans uppercase tracking-wider transition-colors ${
                      location === link.href
                        ? "text-gold"
                        : "text-foreground/70 hover:text-gold"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="ml-2 p-2.5 text-foreground/70 hover:text-gold transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </nav>

            {/* Mobile Controls */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-foreground/70 hover:text-gold transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-foreground/70 hover:text-gold transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="border-t border-border bg-card/95 backdrop-blur-md">
            <div className="container py-4">
              <form onSubmit={handleSearch} className="flex items-center gap-3 max-w-2xl mx-auto">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search articles..."
                    className="w-full pl-12 pr-4 py-3 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-gold-dark font-sans">
                  Search
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card/98 backdrop-blur-md">
            <div className="container py-4 space-y-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`block px-4 py-3 text-sm font-medium font-sans uppercase tracking-wider rounded-lg transition-colors ${
                      location === link.href
                        ? "text-gold bg-gold/10"
                        : "text-foreground/70 hover:text-gold hover:bg-gold/5"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
              <div className="pt-3 border-t border-border mt-3">
                <a
                  href="https://www.instagram.com/vipat_e_bllokut_al"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 text-sm text-foreground/70 hover:text-gold font-sans"
                >
                  <Instagram className="w-4 h-4" />
                  Follow us on Instagram
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Category Navigation */}
      {categories && categories.length > 0 && (
        <div className="border-b border-border/50 bg-card/50">
          <div className="container">
            <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
              <Link href="/">
                <span className={`px-4 py-1.5 text-xs font-semibold font-sans uppercase tracking-wider rounded-full transition-all whitespace-nowrap ${
                  location === "/" ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-gold hover:bg-gold/5"
                }`}>
                  All News
                </span>
              </Link>
              {categories.map((category) => (
                <Link key={category.id} href={`/category/${category.slug}`}>
                  <span className={`px-4 py-1.5 text-xs font-semibold font-sans uppercase tracking-wider rounded-full transition-all whitespace-nowrap ${
                    location === `/category/${category.slug}` ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-gold hover:bg-gold/5"
                  }`}>
                    {category.name}
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

      {/* Footer */}
      <footer className="bg-navy-dark border-t border-border mt-auto">
        {/* Main Footer */}
        <div className="container py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="lg:col-span-1">
              <h3 className="text-2xl font-bold text-gradient-gold mb-4">
                Vipat E Bllokut
              </h3>
              <div className="w-12 h-[2px] bg-gold/60 mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed font-sans mb-6">
                Premium news and media coverage for Albania and the Albanian diaspora worldwide. Delivering truth, insight, and perspective since 2024.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/vipat_e_bllokut_al"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-gold/10 transition-all"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 font-sans">
                Categories
              </h4>
              <div className="w-8 h-[2px] bg-gold/40 mb-4" />
              <div className="space-y-2.5 font-sans">
                {categories?.map((cat) => (
                  <Link key={cat.id} href={`/category/${cat.slug}`}>
                    <span className="block text-sm text-muted-foreground hover:text-gold hover:pl-2 transition-all">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 font-sans">
                Quick Links
              </h4>
              <div className="w-8 h-[2px] bg-gold/40 mb-4" />
              <div className="space-y-2.5 font-sans">
                <Link href="/about">
                  <span className="block text-sm text-muted-foreground hover:text-gold hover:pl-2 transition-all">
                    About Us
                  </span>
                </Link>
                <Link href="/contact">
                  <span className="block text-sm text-muted-foreground hover:text-gold hover:pl-2 transition-all">
                    Contact
                  </span>
                </Link>
                <a
                  href="https://www.instagram.com/vipat_e_bllokut_al"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-muted-foreground hover:text-gold hover:pl-2 transition-all"
                >
                  Instagram
                </a>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 font-sans">
                Contact Us
              </h4>
              <div className="w-8 h-[2px] bg-gold/40 mb-4" />
              <div className="space-y-3 font-sans">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    125 Kingsway, Holborn<br />
                    London WC2B 6NH<br />
                    United Kingdom
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gold flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">+44 7476 921815</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gold flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">info@vipatebllokut.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50">
          <div className="container py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground font-sans">
                &copy; {new Date().getFullYear()} Vipat E Bllokut Ltd. Registered in England & Wales. All rights reserved.
              </p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gold/60" />
                <div className="w-2 h-2 rounded-full bg-gold/40" />
                <div className="w-2 h-2 rounded-full bg-gold/20" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
