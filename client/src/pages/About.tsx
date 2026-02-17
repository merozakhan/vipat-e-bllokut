import Layout from "@/components/Layout";
import { Award, Globe, Users, Target, Shield, Zap } from "lucide-react";

export default function About() {
  return (
    <Layout>
      {/* Hero */}
      <section className="border-b border-border/50">
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-[2px] bg-gold" />
              <span className="text-xs text-gold uppercase tracking-[0.3em] font-sans font-semibold">About Us</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              The Voice of <span className="text-gradient-gold">Albania</span>
            </h1>
            <p className="text-lg text-muted-foreground font-sans leading-relaxed">
              Vipat E Bllokut is a premium news and media company dedicated to delivering accurate, timely, and insightful coverage of Albania and the Albanian diaspora worldwide. Registered in the United Kingdom, we combine international journalistic standards with deep local expertise.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Our Mission</h2>
              </div>
              <p className="text-muted-foreground font-sans leading-relaxed mb-4">
                To provide the Albanian community with reliable, unbiased, and comprehensive news coverage that informs, educates, and empowers. We believe in the power of quality journalism to strengthen communities and drive positive change.
              </p>
              <p className="text-muted-foreground font-sans leading-relaxed">
                Our editorial team is committed to upholding the highest standards of journalistic integrity, ensuring every story we publish meets rigorous fact-checking and ethical guidelines.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Our Vision</h2>
              </div>
              <p className="text-muted-foreground font-sans leading-relaxed mb-4">
                To become the most trusted and influential Albanian media platform globally, bridging the gap between Albania and its diaspora through world-class digital journalism.
              </p>
              <p className="text-muted-foreground font-sans leading-relaxed">
                We envision a future where every Albanian, whether in Tirana, London, or New York, has access to premium-quality news that reflects their heritage and keeps them connected to their roots.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-20 border-t border-border/50 bg-card/30">
        <div className="container">
          <div className="text-center mb-12">
            <div className="w-12 h-[2px] bg-gold mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-foreground mb-3">Our Values</h2>
            <p className="text-muted-foreground font-sans max-w-xl mx-auto">
              The principles that guide every story we tell and every decision we make.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Integrity", desc: "We uphold the highest ethical standards in journalism, ensuring accuracy and fairness in every report." },
              { icon: Zap, title: "Timeliness", desc: "Breaking news delivered as it happens, with real-time updates and comprehensive follow-up coverage." },
              { icon: Users, title: "Community", desc: "We serve the Albanian community worldwide, giving voice to stories that matter to our people." },
              { icon: Globe, title: "Global Reach", desc: "From London to Tirana, our coverage spans borders to keep the Albanian diaspora connected." },
              { icon: Award, title: "Excellence", desc: "Premium quality in everything we do, from investigative journalism to multimedia storytelling." },
              { icon: Target, title: "Impact", desc: "We aim to create meaningful change through journalism that holds power accountable." },
            ].map((value, i) => (
              <div key={i} className="p-6 bg-card rounded-xl border border-border/50 hover:border-gold/30 transition-all premium-card">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mb-4">
                  <value.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="py-16 md:py-20 border-t border-border/50">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-3">Company Information</h2>
              <div className="w-12 h-[2px] bg-gold mx-auto" />
            </div>

            <div className="bg-card rounded-xl border border-border/50 p-8 md:p-10">
              <div className="grid sm:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs text-gold uppercase tracking-wider font-sans font-semibold mb-2">Registered Name</p>
                  <p className="text-foreground font-sans">Vipat E Bllokut Ltd</p>
                </div>
                <div>
                  <p className="text-xs text-gold uppercase tracking-wider font-sans font-semibold mb-2">Jurisdiction</p>
                  <p className="text-foreground font-sans">England & Wales, United Kingdom</p>
                </div>
                <div>
                  <p className="text-xs text-gold uppercase tracking-wider font-sans font-semibold mb-2">Registered Address</p>
                  <p className="text-foreground font-sans">125 Kingsway, Holborn<br />London WC2B 6NH</p>
                </div>
                <div>
                  <p className="text-xs text-gold uppercase tracking-wider font-sans font-semibold mb-2">Contact</p>
                  <p className="text-foreground font-sans">+44 7476 921815<br />info@vipatebllokut.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
