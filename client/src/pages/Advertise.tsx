import Layout from "@/components/Layout";
import { Link } from "wouter";
import { BarChart3, Eye, Globe, Users, Zap, Target, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";

export default function Advertise() {
  const stats = [
    { icon: Eye, value: "500K+", label: "Shikime Mujore" },
    { icon: Users, value: "150K+", label: "Vizitorë Unikë" },
    { icon: Globe, value: "45+", label: "Vende të Arritura" },
    { icon: BarChart3, value: "8min", label: "Kohëzgjatja Mesatare" },
  ];

  const adFormats = [
    {
      title: "Reklama Banner",
      desc: "Vendosje premium e bannerëve në të gjithë faqen tonë me pozicionim të synuar në faqet me trafik të lartë.",
      features: ["Leaderboard (728x90)", "Medium Rectangle (300x250)", "Skyscraper (160x600)", "Mobile Banner (320x50)"],
    },
    {
      title: "Përmbajtje e Sponsorizuar",
      desc: "Artikuj të krijuar nga ekipi ynë editorial që përputhen me mesazhin e brendit tuaj dhe interesat e audiencës sonë.",
      features: ["Shkrim profesional", "I optimizuar për SEO", "Promovim në rrjete sociale", "I etiketuar qartë"],
    },
    {
      title: "Sponsorizim Buletini",
      desc: "Arrini abonentët tanë të angazhuar përmes vendosjeve të dedikuara në buletin dhe edicioneve të sponsorizuara.",
      features: ["Dërgim i dedikuar", "Vendosje banneri", "Targetim i audiencës", "Raportim i performancës"],
    },
    {
      title: "Partneritete të Personalizuara",
      desc: "Partneritete mediatike të personalizuara sipas objektivave tuaja specifike të marketingut dhe audiencës së synuar.",
      features: ["Mbulim eventesh", "Prodhim video", "Fushata sociale", "Integrim brendi"],
    },
  ];

  return (
    <Layout>
      <SEOHead title="Reklamoni me Ne - Advertise With Us" description="Reklamoni biznesin tuaj në Vipat E Bllokut, portalin kryesor të lajmeve shqiptare. Arrini audiencën shqiptare në të gjithë botën." url="/advertise" />
      {/* Hero */}
      <section className="border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent" />
        <div className="container py-16 md:py-24 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-[2px] bg-gold" />
              <span className="text-xs text-gold uppercase tracking-[0.3em] font-sans font-semibold">Bashkëpunoni me Ne</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Reklamoni me <span className="text-gradient-gold">Vipat E Bllokut</span>
            </h1>
            <p className="text-lg text-muted-foreground font-sans leading-relaxed mb-8">
              Lidhni brendin tuaj me audiencën dixhitale shqiptare më të angazhuar. Lexuesit tanë premium shtrihen në diasporën shqiptare në mbi 45 vende, duke ofruar përhapje dhe angazhim të pakrahasueshëm për fushatat tuaja të marketingut.
            </p>
            <Link href="/contact">
              <Button className="bg-accent text-accent-foreground hover:bg-gold-dark font-sans px-8 py-3 text-sm uppercase tracking-wider font-semibold">
                Filloni Tani
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
              <span className="text-xs text-gold uppercase tracking-[0.3em] font-sans font-semibold">Pse të Na Zgjidhni</span>
              <div className="w-8 h-[2px] bg-gold" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Pse të Reklamoni me Ne?
            </h2>
            <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
              Ofrojmë një kombinim unik të audiencës premium, besueshmërisë editoriale dhe rezultateve të matshme.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card rounded-xl p-8">
              <Target className="w-10 h-10 text-gold mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-3">Përhapje e Synuar</h3>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                Audienca jonë përbëhet kryesisht nga profesionistë shqiptarfolës dhe anëtarë të diasporës në Europë, Amerikën e Veriut dhe më gjerë. Arrini demografikun e saktë që biznesi juaj ka nevojë.
              </p>
            </div>
            <div className="glass-card rounded-xl p-8">
              <Zap className="w-10 h-10 text-gold mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-3">Angazhim i Lartë</h3>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                Lexuesit tanë kalojnë mesatarisht 8 minuta për seancë, me norma të larta kthimi. Mesazhi juaj do të shihet nga një audiencë që është aktivisht e angazhuar me përmbajtjen tonë.
              </p>
            </div>
            <div className="glass-card rounded-xl p-8">
              <BarChart3 className="w-10 h-10 text-gold mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-3">Rezultate të Matshme</h3>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                Ofrojmë analitika të detajuara dhe raporte performancë për të gjitha fushatat reklamuese, duke siguruar transparencë të plotë dhe optimizim të bazuar në të dhëna.
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
              Formatet e Reklamimit
            </h2>
            <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
              Zgjidhni nga gama jonë e zgjidhjeve premium të reklamimit të dizajnuara për të maksimizuar ndikimin e brendit tuaj.
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
              Gati të Rritni Brendin Tuaj?
            </h2>
            <p className="text-muted-foreground font-sans mb-8 leading-relaxed">
              Kontaktoni ekipin tonë të reklamimit sot për të diskutuar se si mund t'ju ndihmojmë të arrini audiencën dixhitale shqiptare më të angazhuar. Ofrojmë paketa fleksibël të përshtatura sipas buxhetit dhe objektivave tuaja.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact">
                <Button className="bg-accent text-accent-foreground hover:bg-gold-dark font-sans px-8 py-3 text-sm uppercase tracking-wider font-semibold">
                  Kontaktoni Ekipin e Reklamimit
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="mailto:info@vipatebllokut.com">
                <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 font-sans px-8 py-3 text-sm uppercase tracking-wider font-semibold">
                  Na Dërgoni Email Direkt
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
