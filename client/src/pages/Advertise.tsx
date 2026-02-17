import Layout from "@/components/Layout";
import { Link } from "wouter";
import { BarChart3, Eye, Globe, Users, Zap, Target, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Advertise() {
  const stats = [
    { icon: Eye, value: "500K+", label: "Monthly Page Views" },
    { icon: Users, value: "150K+", label: "Unique Visitors" },
    { icon: Globe, value: "45+", label: "Countries Reached" },
    { icon: BarChart3, value: "8min", label: "Avg. Session Duration" },
  ];

  const adFormats = [
    {
      title: "Display Advertising",
      desc: "Premium banner placements across our website with targeted positioning on high-traffic pages.",
      features: ["Leaderboard (728x90)", "Medium Rectangle (300x250)", "Skyscraper (160x600)", "Mobile Banner (320x50)"],
    },
    {
      title: "Sponsored Content",
      desc: "Native articles crafted by our editorial team that align with your brand message and our audience interests.",
      features: ["Professional writing", "SEO optimised", "Social media promotion", "Clearly labelled"],
    },
    {
      title: "Newsletter Sponsorship",
      desc: "Reach our engaged email subscribers with dedicated newsletter placements and sponsored editions.",
      features: ["Dedicated send", "Banner placement", "Audience targeting", "Performance reporting"],
    },
    {
      title: "Custom Partnerships",
      desc: "Bespoke media partnerships tailored to your specific marketing objectives and target audience.",
      features: ["Event coverage", "Video production", "Social campaigns", "Brand integration"],
    },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent" />
        <div className="container py-16 md:py-24 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-[2px] bg-gold" />
              <span className="text-xs text-gold uppercase tracking-[0.3em] font-sans font-semibold">Partner With Us</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Advertise With <span className="text-gradient-gold">Vipat E Bllokut</span>
            </h1>
            <p className="text-lg text-muted-foreground font-sans leading-relaxed mb-8">
              Connect your brand with Albania's most engaged digital audience. Our premium readership spans the Albanian diaspora across 45+ countries, offering unparalleled reach and engagement for your marketing campaigns.
            </p>
            <Link href="/contact">
              <Button className="bg-accent text-accent-foreground hover:bg-gold-dark font-sans px-8 py-3 text-sm uppercase tracking-wider font-semibold">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-b border-border/50">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl p-6 text-center">
                <stat.icon className="w-8 h-8 text-gold mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-bold text-gradient-gold mb-1">{stat.value}</div>
                <p className="text-xs text-muted-foreground font-sans uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Advertise */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-[2px] bg-gold" />
              <span className="text-xs text-gold uppercase tracking-[0.3em] font-sans font-semibold">Why Choose Us</span>
              <div className="w-8 h-[2px] bg-gold" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Advertise With Us?
            </h2>
            <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
              We offer a unique combination of premium audience, editorial credibility, and measurable results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card rounded-xl p-8">
              <Target className="w-10 h-10 text-gold mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-3">Targeted Reach</h3>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                Our audience is predominantly Albanian-speaking professionals and diaspora members across Europe, North America, and beyond. Reach the exact demographic your business needs.
              </p>
            </div>
            <div className="glass-card rounded-xl p-8">
              <Zap className="w-10 h-10 text-gold mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-3">High Engagement</h3>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                Our readers spend an average of 8 minutes per session, with high return visitor rates. Your message will be seen by an audience that is actively engaged with our content.
              </p>
            </div>
            <div className="glass-card rounded-xl p-8">
              <BarChart3 className="w-10 h-10 text-gold mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-3">Measurable Results</h3>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                We provide detailed analytics and performance reports for all advertising campaigns, ensuring complete transparency and data-driven optimisation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Formats */}
      <section className="py-16 md:py-20 bg-card/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Advertising Formats
            </h2>
            <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
              Choose from our range of premium advertising solutions designed to maximise your brand's impact.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {adFormats.map((format) => (
              <div key={format.title} className="glass-card rounded-xl p-8 premium-card">
                <h3 className="text-xl font-bold text-foreground mb-3">{format.title}</h3>
                <p className="text-sm text-muted-foreground font-sans leading-relaxed mb-4">{format.desc}</p>
                <ul className="space-y-2">
                  {format.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground font-sans">
                      <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Grow Your Brand?
            </h2>
            <p className="text-muted-foreground font-sans mb-8 leading-relaxed">
              Contact our advertising team today to discuss how we can help you reach Albania's most engaged digital audience. We offer flexible packages tailored to your budget and objectives.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact">
                <Button className="bg-accent text-accent-foreground hover:bg-gold-dark font-sans px-8 py-3 text-sm uppercase tracking-wider font-semibold">
                  Contact Advertising Team
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="mailto:info@vipatebllokut.com">
                <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 font-sans px-8 py-3 text-sm uppercase tracking-wider font-semibold">
                  Email Us Directly
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
