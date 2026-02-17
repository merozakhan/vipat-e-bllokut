import Layout from "@/components/Layout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Instagram, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitted(true);
    toast.success("Message sent successfully!");
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="border-b border-border/50">
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-[2px] bg-gold" />
              <span className="text-xs text-gold uppercase tracking-[0.3em] font-sans font-semibold">Get In Touch</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Contact <span className="text-gradient-gold">Us</span>
            </h1>
            <p className="text-lg text-muted-foreground font-sans leading-relaxed">
              Have a news tip, story idea, or business inquiry? We would love to hear from you. Reach out to our team and we will get back to you promptly.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Contact Info */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-foreground mb-8">Reach Our Team</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-5 bg-card rounded-xl border border-border/50">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground font-sans uppercase tracking-wider mb-1">Office</h3>
                    <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                      125 Kingsway, Holborn<br />
                      London WC2B 6NH<br />
                      United Kingdom
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-card rounded-xl border border-border/50">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground font-sans uppercase tracking-wider mb-1">Phone</h3>
                    <p className="text-sm text-muted-foreground font-sans">+44 7476 921815</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-card rounded-xl border border-border/50">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground font-sans uppercase tracking-wider mb-1">Email</h3>
                    <p className="text-sm text-muted-foreground font-sans">info@vipatebllokut.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-card rounded-xl border border-border/50">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Instagram className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground font-sans uppercase tracking-wider mb-1">Social</h3>
                    <a
                      href="https://www.instagram.com/vipat_e_bllokut_al"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gold hover:text-gold-light font-sans transition-colors"
                    >
                      @vipat_e_bllokut_al
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-card rounded-xl border border-border/50 p-8 md:p-10">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-8 h-8 text-gold" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">Message Sent</h3>
                    <p className="text-muted-foreground font-sans mb-6">
                      Thank you for reaching out. Our team will review your message and respond within 24 hours.
                    </p>
                    <Button
                      onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", subject: "", message: "" }); }}
                      className="bg-accent text-accent-foreground hover:bg-gold-dark font-sans"
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Send a Message</h2>
                    <p className="text-sm text-muted-foreground font-sans mb-8">
                      Fill out the form below and our team will get back to you.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2 font-sans">
                            Name <span className="text-gold">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm"
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2 font-sans">
                            Email <span className="text-gold">*</span>
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm"
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2 font-sans">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm"
                          placeholder="What is this about?"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2 font-sans">
                          Message <span className="text-gold">*</span>
                        </label>
                        <textarea
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          rows={6}
                          className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 font-sans text-sm resize-none"
                          placeholder="Your message..."
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-accent text-accent-foreground hover:bg-gold-dark font-sans py-3 text-sm uppercase tracking-wider font-semibold"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
