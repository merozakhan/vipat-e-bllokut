import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Search, Menu, X, Instagram, Mail, Phone, MapPin, ChevronRight, ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function BreakingNewsTicker() {
  const { data: articles } = trpc.articles.getPublished.useQuery({ limit: 5 });

  if (!articles || articles.length === 0) return null;

  const tickerItems = [...articles, ...articles];

  return (
    <div className="bg-gold/5 border-b border-gold/10 overflow-hidden">
      <div className="container flex items-center">
        <div className="flex-shrink-0 bg-accent text-accent-foreground px-4 py-2 text-xs font-bold uppercase tracking-widest font-sans flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-foreground pulse-dot" />
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
  const [newsletterEmail, setNewsletterEmail] = useState("");
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

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      toast.success("Thank you for subscribing! You'll receive our latest news updates.");
      setNewsletterEmail("");
    }
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/advertise", label: "Advertise" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="bg-navy-dark border-b border-border/30 hidden md:block">
        <div className="container">
          <div className="flex items-center justify-between py-2 text-xs text-muted-foreground font-sans">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-gold/70" />
                London, United Kingdom
              </span>
              <a href="tel:+447476921815" className="flex items-center gap-1.5 hover:text-gold transition-colors">
                <Phone className="w-3 h-3 text-gold/70" />
                +44 7476 921815
              </a>
              <a href="mailto:info@vipatebllokut.com" className="flex items-center gap-1.5 hover:text-gold transition-colors">
                <Mail className="w-3 h-3 text-gold/70" />
                info@vipatebllokut.com
              </a>
            </div>
            <div className="flex items-center gap-4">
              <span>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
              <div className="w-[1px] h-3 bg-border/50" />
              <a
                href="https://www.instagram.com/vipat_e_bllokut_al"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? "bg-background/95 backdrop-blur-xl shadow-lg shadow-black/20" : "bg-background"} border-b border-border/50`}>
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
                    className={`px-4 py-2 text-sm font-medium font-sans uppercase tracking-wider transition-colors underline-gold ${
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
                    placeholder="Search articles..."
                    className="w-full pl-12 pr-4 py-3 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm input-premium"
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
          <div className="lg:hidden border-t border-border bg-card/98 backdrop-blur-xl animate-fade-in-up">
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
        <div className="border-b border-border/30 bg-card/30">
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

      {/* Newsletter Section */}
      <section className="border-t border-border/50 bg-gradient-to-b from-card/50 to-background">
        <div className="container py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-[2px] bg-gold/60" />
              <span className="text-xs text-gold uppercase tracking-[0.3em] font-sans font-semibold">Stay Informed</span>
              <div className="w-8 h-[2px] bg-gold/60" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Subscribe to Our Newsletter
            </h3>
            <p className="text-sm text-muted-foreground font-sans mb-6">
              Get the latest Albanian news delivered directly to your inbox. No spam, unsubscribe at any time.
            </p>
            <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full sm:flex-1 px-4 py-3 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm input-premium"
                required
              />
              <Button type="submit" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-gold-dark font-sans px-6 text-sm uppercase tracking-wider font-semibold">
                Subscribe
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-dark border-t border-border/30">
        {/* Main Footer */}
        <div className="container py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand */}
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-bold text-gradient-gold mb-4">
                Vipat E Bllokut
              </h3>
              <div className="w-12 h-[2px] bg-gold/60 mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed font-sans mb-6">
                Premium news and media coverage for Albania and the Albanian diaspora worldwide. Delivering truth, insight, and perspective. Registered in England & Wales.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/vipat_e_bllokut_al"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-gold/10 transition-all"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="mailto:info@vipatebllokut.com"
                  className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-gold/10 transition-all"
                  aria-label="Email"
                >
                  <Mail className="w-5 h-5" />
                </a>
                <a
                  href="tel:+447476921815"
                  className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-gold/10 transition-all"
                  aria-label="Phone"
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 font-sans">
                Company
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
                <Link href="/advertise">
                  <span className="block text-sm text-muted-foreground hover:text-gold hover:pl-2 transition-all">
                    Advertise With Us
                  </span>
                </Link>
                <Link href="/editorial-policy">
                  <span className="block text-sm text-muted-foreground hover:text-gold hover:pl-2 transition-all">
                    Editorial Policy
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

            {/* Legal */}
            <div>
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 font-sans">
                Legal
              </h4>
              <div className="w-8 h-[2px] bg-gold/40 mb-4" />
              <div className="space-y-2.5 font-sans">
                <Link href="/privacy-policy">
                  <span className="block text-sm text-muted-foreground hover:text-gold hover:pl-2 transition-all">
                    Privacy Policy
                  </span>
                </Link>
                <Link href="/terms">
                  <span className="block text-sm text-muted-foreground hover:text-gold hover:pl-2 transition-all">
                    Terms of Service
                  </span>
                </Link>
                <Link href="/gdpr">
                  <span className="block text-sm text-muted-foreground hover:text-gold hover:pl-2 transition-all">
                    GDPR Compliance
                  </span>
                </Link>
                <Link href="/cookie-policy">
                  <span className="block text-sm text-muted-foreground hover:text-gold hover:pl-2 transition-all">
                    Cookie Policy
                  </span>
                </Link>
                <Link href="/editorial-policy">
                  <span className="block text-sm text-muted-foreground hover:text-gold hover:pl-2 transition-all">
                    Editorial Policy
                  </span>
                </Link>
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
                  <MapPin className="w-4 h-4 text-gold/70 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    125 Kingsway, Holborn<br />
                    London WC2B 6NH<br />
                    United Kingdom
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gold/70 flex-shrink-0" />
                  <a href="tel:+447476921815" className="text-sm text-muted-foreground hover:text-gold transition-colors">
                    +44 7476 921815
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gold/70 flex-shrink-0" />
                  <a href="mailto:info@vipatebllokut.com" className="text-sm text-muted-foreground hover:text-gold transition-colors">
                    info@vipatebllokut.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-gold/70 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Reg. in England & Wales
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/30">
          <div className="container py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground/70 font-sans">
                &copy; {new Date().getFullYear()} Vipat E Bllokut Ltd. Registered in England & Wales. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground/60 font-sans">
                <Link href="/privacy-policy">
                  <span className="hover:text-gold transition-colors">Privacy</span>
                </Link>
                <span className="text-border">|</span>
                <Link href="/terms">
                  <span className="hover:text-gold transition-colors">Terms</span>
                </Link>
                <span className="text-border">|</span>
                <Link href="/cookie-policy">
                  <span className="hover:text-gold transition-colors">Cookies</span>
                </Link>
                <span className="text-border">|</span>
                <Link href="/gdpr">
                  <span className="hover:text-gold transition-colors">GDPR</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
