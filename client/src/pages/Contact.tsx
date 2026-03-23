import Layout from "@/components/Layout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Instagram, Send, CheckCircle, ChevronDown, Clock, MessageSquare, HelpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import SEOHead from "@/components/SEOHead";

const contactReasons = [
  { value: "general", label: "Pyetje të Përgjithshme", desc: "Pyetje të përgjithshme rreth shërbimeve tona", responseTime: "24 orë" },
  { value: "editorial", label: "Editoriale / Këshilla Lajmesh", desc: "Dërgoni një këshillë lajmi ose koment editorial", responseTime: "12 orë" },
  { value: "advertising", label: "Reklama dhe Partneritete", desc: "Diskutoni mundësitë e reklamimit dhe partneriteteve mediatike", responseTime: "24 orë" },
  { value: "marketing", label: "Bashkëpunim Marketingu", desc: "Propozoni bashkëpunime marketingu ose partneritete brendi", responseTime: "48 orë" },
  { value: "press", label: "Pyetje për Shtypin dhe Median", desc: "Njoftimet për shtypin, akreditimet mediatike dhe kërkesat për intervista", responseTime: "12 orë" },
  { value: "legal", label: "Ligjore / Përputhshmëri", desc: "Çështje ligjore, kërkesa GDPR ose pyetje përputhshmërie", responseTime: "5 ditë pune" },
  { value: "technical", label: "Mbështetje Teknike", desc: "Raportoni probleme me faqen ose çështje teknike", responseTime: "24 orë" },
  { value: "careers", label: "Karriera dhe Punë të Pavarura", desc: "Mundësi punësimi dhe pozicione të shkrimit të pavarur", responseTime: "1 javë" },
];

const faqs = [
  {
    q: "Si mund të dërgoj një këshillë lajmi?",
    a: "Zgjidhni 'Editoriale / Këshilla Lajmesh' nga lista e arsyeve të kontaktit dhe jepni sa më shumë detaje të jetë e mundur. Mund të na dërgoni email direkt në info@vipatebllokut.com me subjektin 'Këshillë Lajmi'.",
  },
  {
    q: "Çfarë opsionesh reklamimi ofroni?",
    a: "Ofrojmë reklama banner, përmbajtje të sponsorizuar, sponsorizim buletini dhe partneritete mediatike të personalizuara. Vizitoni faqen tonë të Reklamimit për informacione të detajuara, ose zgjidhni 'Reklama dhe Partneritete' për të na kontaktuar.",
  },
  {
    q: "Si mund të kërkoj fshirjen e të dhënave personale?",
    a: "Zgjidhni 'Ligjore / Përputhshmëri' si arsye kontakti dhe specifikoni që dëshironi të ushtroni të drejtën tuaj për fshirje sipas GDPR. Kërkesa juaj do të përpunohet brenda 30 ditëve.",
  },
  {
    q: "A po punësoni shkrimtarë ose gazetarë?",
    a: "Jemi gjithmonë në kërkim të shkrimtarëve dhe gazetarëve të talentuar, veçanërisht atyre me ekspertizë në çështjet shqiptare. Zgjidhni 'Karriera dhe Punë të Pavarura' dhe përfshini CV-në ose linkun e portofolit tuaj.",
  },
  {
    q: "Sa shpejt do të marr përgjigje?",
    a: "Kohët e përgjigjes ndryshojnë sipas departamentit. Pyetjet editoriale dhe të shtypit zakonisht marrin përgjigje brenda 12 orëve. Pyetjet e përgjithshme dhe të reklamimit brenda 24-48 orëve. Çështjet ligjore brenda 5 ditëve të punës.",
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    reason: "",
    subject: "",
    message: "",
    budget: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const selectedReason = contactReasons.find((r) => r.value === formData.reason);
  const showBudget = formData.reason === "advertising" || formData.reason === "marketing";

  const contactMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Mesazhi u dërgua me sukses!");
    },
    onError: (error) => {
      toast.error(error.message || "Dështoi dërgimi i mesazhit. Provoni përsëri ose na dërgoni email direkt në info@vipatebllokut.com");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.reason || !formData.message) {
      toast.error("Ju lutem plotësoni të gjitha fushat e detyrueshme.");
      return;
    }
    contactMutation.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      company: formData.company || undefined,
      reason: formData.reason,
      subject: formData.subject || undefined,
      message: formData.message,
      budget: formData.budget || undefined,
    });
  };

  return (
    <Layout>
      <SEOHead title="Na Kontaktoni - Contact Us" description="Kontaktoni Vipat E Bllokut për bashkëpunim, reklama, ose pyetje të përgjithshme. Email: info@vipatebllokut.com, Tel: +44 7476 921815" url="/contact" />
      {/* Hero */}
      <section className="border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/3 via-transparent to-transparent" />
        <div className="container py-16 md:py-24 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-[2px] bg-gold" />
              <span className="text-xs text-gold uppercase tracking-[0.3em] font-sans font-semibold">Na Kontaktoni</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Na <span className="text-gradient-gold">Kontaktoni</span>
            </h1>
            <p className="text-lg text-muted-foreground font-sans leading-relaxed">
              Qoftë një këshillë lajmi, pyetje biznesi ose propozim partneriteti, ekipi ynë është gati t'ju ndihmojë. Zgjidhni departamentin e duhur më poshtë për t'u siguruar që mesazhi juaj arrin ekipin e duhur.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-12 border-b border-border/50">
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            <div className="glass-card rounded-xl p-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-xs font-bold text-foreground font-sans uppercase tracking-wider mb-2">Office</h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Flat 1 Pmb 0512 85 Moss Bank<br />
                Manchester M8 5AP<br />
                United Kingdom
              </p>
            </div>
            <div className="glass-card rounded-xl p-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-xs font-bold text-foreground font-sans uppercase tracking-wider mb-2">Phone</h3>
              <p className="text-xs text-muted-foreground font-sans">+44 7476 921815</p>
              <p className="text-xs text-muted-foreground/60 font-sans mt-1">Mon-Fri, 9:00-18:00 GMT</p>
            </div>
            <a href="mailto:info@vipatebllokut.com" className="glass-card rounded-xl p-5 text-center group">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-gold/20 transition-colors">
                <Mail className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-xs font-bold text-foreground font-sans uppercase tracking-wider mb-2">Email</h3>
              <p className="text-xs text-gold font-sans">info@vipatebllokut.com</p>
              <p className="text-xs text-muted-foreground/60 font-sans mt-1">We respond within 24h</p>
            </a>
            <a
              href="https://www.instagram.com/vipat_e_bllokut_al"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card rounded-xl p-5 text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-gold/20 transition-colors">
                <Instagram className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-xs font-bold text-foreground font-sans uppercase tracking-wider mb-2">Instagram</h3>
              <p className="text-xs text-gold font-sans">@vipat_e_bllokut_al</p>
              <p className="text-xs text-muted-foreground/60 font-sans mt-1">Follow for updates</p>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border border-border/50 p-8 md:p-10">
                {submitted ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6 glow-gold">
                      <CheckCircle className="w-10 h-10 text-gold" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">Message Sent Successfully</h3>
                    <p className="text-muted-foreground font-sans mb-2 max-w-md mx-auto">
                      Thank you for reaching out. Your message has been sent to <strong className="text-gold">info@vipatebllokut.com</strong> and routed to our <strong className="text-foreground">{selectedReason?.label}</strong> team.
                    </p>
                    {selectedReason && (
                      <div className="flex items-center justify-center gap-2 text-sm text-gold font-sans mb-8">
                        <Clock className="w-4 h-4" />
                        Expected response time: {selectedReason.responseTime}
                      </div>
                    )}
                    <Button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: "", email: "", phone: "", company: "", reason: "", subject: "", message: "", budget: "" });
                      }}
                      className="bg-accent text-accent-foreground hover:bg-gold-dark font-sans"
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare className="w-5 h-5 text-gold" />
                      <h2 className="text-2xl font-bold text-foreground">Send a Message</h2>
                    </div>
                    <p className="text-sm text-muted-foreground font-sans mb-8">
                      Select a department and fill out the form below. Your message will be sent directly to <strong className="text-gold">info@vipatebllokut.com</strong>. Required fields are marked with an asterisk.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Reason Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2 font-sans">
                          Reason for Contact <span className="text-gold">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full px-4 py-3.5 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm appearance-none input-premium"
                          >
                            <option value="">Select a department...</option>
                            {contactReasons.map((reason) => (
                              <option key={reason.value} value={reason.value}>
                                {reason.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                        {selectedReason && (
                          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground font-sans">
                            <span>{selectedReason.desc}</span>
                            <span className="flex items-center gap-1 text-gold/80">
                              <Clock className="w-3 h-3" />
                              Response: {selectedReason.responseTime}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Name & Email */}
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2 font-sans">
                            Full Name <span className="text-gold">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm input-premium"
                            placeholder="Your full name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2 font-sans">
                            Email Address <span className="text-gold">*</span>
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm input-premium"
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>

                      {/* Phone & Company */}
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2 font-sans">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm input-premium"
                            placeholder="+44 7XXX XXXXXX"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2 font-sans">
                            Company / Organisation
                          </label>
                          <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm input-premium"
                            placeholder="Your company name"
                          />
                        </div>
                      </div>

                      {/* Budget (conditional) */}
                      {showBudget && (
                        <div>
                          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2 font-sans">
                            Budget Range
                          </label>
                          <div className="relative">
                            <select
                              value={formData.budget}
                              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                              className="w-full px-4 py-3.5 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm appearance-none input-premium"
                            >
                              <option value="">Select budget range...</option>
                              <option value="Under £500">Under £500</option>
                              <option value="£500 - £1,000">£500 - £1,000</option>
                              <option value="£1,000 - £5,000">£1,000 - £5,000</option>
                              <option value="£5,000 - £10,000">£5,000 - £10,000</option>
                              <option value="£10,000 - £25,000">£10,000 - £25,000</option>
                              <option value="£25,000+">£25,000+</option>
                              <option value="Prefer to discuss">Prefer to discuss</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>
                      )}

                      {/* Subject */}
                      <div>
                        <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2 font-sans">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm input-premium"
                          placeholder="Brief subject of your message"
                        />
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2 font-sans">
                          Message <span className="text-gold">*</span>
                        </label>
                        <textarea
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          rows={6}
                          className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm resize-none input-premium"
                          placeholder="Please provide as much detail as possible..."
                        />
                      </div>

                      {/* Submit */}
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-muted-foreground font-sans">
                          By submitting, you agree to our{" "}
                          <a href="/privacy-policy" className="text-gold hover:text-gold-light transition-colors">Privacy Policy</a>.
                        </p>
                        <Button
                          type="submit"
                          disabled={contactMutation.isPending}
                          className="bg-accent text-accent-foreground hover:bg-gold-dark font-sans px-8 py-3 text-sm uppercase tracking-wider font-semibold disabled:opacity-50"
                        >
                          {contactMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar - FAQ */}
            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <div className="flex items-center gap-2 mb-6">
                  <HelpCircle className="w-5 h-5 text-gold" />
                  <h3 className="text-lg font-bold text-foreground">Frequently Asked Questions</h3>
                </div>

                <div className="space-y-3">
                  {faqs.map((faq, i) => (
                    <div
                      key={i}
                      className="glass-card rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                        className="w-full text-left px-5 py-4 flex items-start justify-between gap-3"
                      >
                        <span className="text-sm font-medium text-foreground font-sans leading-snug">{faq.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-gold flex-shrink-0 mt-0.5 transition-transform duration-300 ${
                            expandedFaq === i ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {expandedFaq === i && (
                        <div className="px-5 pb-4">
                          <p className="text-xs text-muted-foreground font-sans leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Quick Contact */}
                <div className="mt-8 glass-card rounded-xl p-6">
                  <h4 className="text-sm font-bold text-foreground font-sans uppercase tracking-wider mb-3">Need Urgent Help?</h4>
                  <p className="text-xs text-muted-foreground font-sans mb-4">
                    For time-sensitive matters, contact us directly:
                  </p>
                  <div className="space-y-2">
                    <a href="tel:+447476921815" className="flex items-center gap-2 text-sm text-gold hover:text-gold-light font-sans transition-colors">
                      <Phone className="w-4 h-4" />
                      +44 7476 921815
                    </a>
                    <a href="mailto:info@vipatebllokut.com" className="flex items-center gap-2 text-sm text-gold hover:text-gold-light font-sans transition-colors">
                      <Mail className="w-4 h-4" />
                      info@vipatebllokut.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
