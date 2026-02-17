import Layout from "@/components/Layout";
import { Link } from "wouter";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LegalPageProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalPage({ title, subtitle, lastUpdated, children }: LegalPageProps) {
  return (
    <Layout>
      {/* Header */}
      <section className="border-b border-border/50">
        <div className="container py-12 md:py-16">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground hover:text-gold font-sans">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-[2px] bg-gold" />
            <span className="text-xs text-gold uppercase tracking-[0.3em] font-sans font-semibold">Legal</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground font-sans max-w-2xl mb-4">{subtitle}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-sans">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gold/60" />
              Last updated: {lastUpdated}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gold/60" />
              Vipat E Bllokut Ltd
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-xl border border-border/50 p-8 md:p-12 legal-content">
              {children}
            </div>

            {/* Related Legal Pages */}
            <div className="mt-12 pt-8 border-t border-border/50">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-6 font-sans">Related Policies</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                <Link href="/privacy-policy">
                  <div className="glass-card rounded-lg p-4 hover:border-gold/20 transition-all group">
                    <h4 className="text-sm font-semibold text-card-foreground group-hover:text-gold transition-colors font-sans">Privacy Policy</h4>
                    <p className="text-xs text-muted-foreground mt-1 font-sans">How we handle your data</p>
                  </div>
                </Link>
                <Link href="/gdpr">
                  <div className="glass-card rounded-lg p-4 hover:border-gold/20 transition-all group">
                    <h4 className="text-sm font-semibold text-card-foreground group-hover:text-gold transition-colors font-sans">GDPR Compliance</h4>
                    <p className="text-xs text-muted-foreground mt-1 font-sans">Your data rights</p>
                  </div>
                </Link>
                <Link href="/terms">
                  <div className="glass-card rounded-lg p-4 hover:border-gold/20 transition-all group">
                    <h4 className="text-sm font-semibold text-card-foreground group-hover:text-gold transition-colors font-sans">Terms of Service</h4>
                    <p className="text-xs text-muted-foreground mt-1 font-sans">Usage conditions</p>
                  </div>
                </Link>
                <Link href="/cookie-policy">
                  <div className="glass-card rounded-lg p-4 hover:border-gold/20 transition-all group">
                    <h4 className="text-sm font-semibold text-card-foreground group-hover:text-gold transition-colors font-sans">Cookie Policy</h4>
                    <p className="text-xs text-muted-foreground mt-1 font-sans">Cookie usage details</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
