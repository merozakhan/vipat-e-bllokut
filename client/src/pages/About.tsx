import Layout from "@/components/Layout";
import { Award, Globe, Users, Target, Shield, Zap } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function About() {
  return (
    <Layout>
      <SEOHead
        title="Rreth Nesh - About Us"
        description="Vipat E Bllokut Ltd është një kompani mediatike e regjistruar në Mbretërinë e Bashkuar. Misioni ynë është të ofrojmë lajme të besueshme dhe të paanshme për shqiptarët kudo në botë."
        url="/about"
      />
      {/* Hero */}
      <section className="border-b border-border/50">
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-[2px] bg-gold" />
              <span className="text-xs text-gold uppercase tracking-[0.3em] font-sans font-semibold">Rreth Nesh</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Zëri i <span className="text-gradient-gold">Shqipërisë</span>
            </h1>
            <p className="text-lg text-muted-foreground font-sans leading-relaxed">
              Vipat E Bllokut është një kompani e nivelit të lartë e lajmeve dhe medias, e dedikuar në ofrimin e mbulimit të saktë, të shpejtë dhe analitik për Shqipërinë dhe diasporën shqiptare në të gjithë botën. E regjistruar në Mbretërinë e Bashkuar, ne kombinojmë standardet ndërkombëtare të gazetarisë me ekspertizë të thellë vendore.
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
                <h2 className="text-2xl font-bold text-foreground">Misioni Ynë</h2>
              </div>
              <p className="text-muted-foreground font-sans leading-relaxed mb-4">
                T'i ofrojmë komunitetit shqiptar mbulim lajmesh të besueshëm, të paanshëm dhe gjithëpërfshirës që informon, edukon dhe fuqizon. Ne besojmë në fuqinë e gazetarisë cilësore për të forcuar komunitetet dhe nxitur ndryshime pozitive.
              </p>
              <p className="text-muted-foreground font-sans leading-relaxed">
                Ekipi ynë editorial është i përkushtuar në ruajtjen e standardeve më të larta të integritetit gazetaresk, duke siguruar që çdo histori që publikojmë i plotëson udhëzimet rigoroze të verifikimit të fakteve dhe etikës.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Vizioni Ynë</h2>
              </div>
              <p className="text-muted-foreground font-sans leading-relaxed mb-4">
                Të bëhemi platforma mediatike shqiptare më e besuar dhe me ndikim më të madh në botë, duke lidhur Shqipërinë me diasporën e saj përmes gazetarisë dixhitale të nivelit botëror.
              </p>
              <p className="text-muted-foreground font-sans leading-relaxed">
                Ne shohim një të ardhme ku çdo shqiptar, qoftë në Tiranë, Londër apo Nju-Jork, ka akses në lajme të cilësisë së lartë që pasqyrojnë trashëgiminë e tyre dhe i mbajnë të lidhur me rrënjët e tyre.
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
            <h2 className="text-3xl font-bold text-foreground mb-3">Vlerat Tona</h2>
            <p className="text-muted-foreground font-sans max-w-xl mx-auto">
              Parimet që udhëheqin çdo histori që tregojmë dhe çdo vendim që marrim.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Integriteti", desc: "Ruajmë standardet më të larta etike në gazetari, duke siguruar saktësi dhe paanshmëri në çdo raportim." },
              { icon: Zap, title: "Shpejtësia", desc: "Lajme të fundit të sjella në kohë reale, me përditësime të menjëhershme dhe mbulim të plotë vijues." },
              { icon: Users, title: "Komuniteti", desc: "I shërbejmë komunitetit shqiptar në të gjithë botën, duke i dhënë zë historive që kanë rëndësi për njerëzit tanë." },
              { icon: Globe, title: "Përhapja Globale", desc: "Nga Londra në Tiranë, mbulimi ynë kalon kufijtë për të mbajtur diasporën shqiptare të lidhur." },
              { icon: Award, title: "Përsosmëria", desc: "Cilësi e lartë në gjithçka që bëjmë, nga gazetaria investigative te tregimi multimedial." },
              { icon: Target, title: "Ndikimi", desc: "Synojmë të krijojmë ndryshim domethënës përmes gazetarisë që mban pushtetin përgjegjës." },
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
              <h2 className="text-3xl font-bold text-foreground mb-3">Informacione mbi Kompaninë</h2>
              <div className="w-12 h-[2px] bg-gold mx-auto" />
            </div>

            <div className="bg-card rounded-xl border border-border/50 p-8 md:p-10">
              <div className="grid sm:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs text-gold uppercase tracking-wider font-sans font-semibold mb-2">Emri i Regjistruar</p>
                  <p className="text-foreground font-sans">Vipat E Bllokut Ltd</p>
                </div>
                <div>
                  <p className="text-xs text-gold uppercase tracking-wider font-sans font-semibold mb-2">Juridiksioni</p>
                  <p className="text-foreground font-sans">Angli dhe Uells, Mbretëria e Bashkuar</p>
                </div>
                <div>
                  <p className="text-xs text-gold uppercase tracking-wider font-sans font-semibold mb-2">Adresa e Regjistruar</p>
                  <p className="text-foreground font-sans">Flat 1 Pmb 0512 85 Moss Bank<br />Manchester M8 5AP</p>
                </div>
                <div>
                  <p className="text-xs text-gold uppercase tracking-wider font-sans font-semibold mb-2">Kontakt</p>
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
