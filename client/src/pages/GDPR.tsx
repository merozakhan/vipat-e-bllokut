import LegalPage from "@/components/LegalPage";

export default function GDPR() {
  return (
    <LegalPage
      title="GDPR Compliance"
      subtitle="We are committed to ensuring your data rights are protected under the General Data Protection Regulation."
      lastUpdated="17 February 2026"
    >
      <div className="space-y-8 text-card-foreground font-sans text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">1. Our Commitment to GDPR</h2>
          <p className="text-muted-foreground">
            Vipat E Bllokut Ltd is fully committed to complying with the UK General Data Protection Regulation (UK GDPR) and the EU General Data Protection Regulation (EU GDPR) where applicable. As a UK-registered media company, we take our data protection responsibilities seriously and have implemented comprehensive measures to ensure compliance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">2. Data Controller</h2>
          <p className="text-muted-foreground">
            Vipat E Bllokut Ltd acts as the Data Controller for personal data collected through this website. Our registered address is 125 Kingsway, Holborn, London WC2B 6NH, United Kingdom. For all data protection enquiries, please contact us at <a href="mailto:info@vipatebllokut.com" className="text-gold hover:text-gold-light transition-colors">info@vipatebllokut.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">3. Lawful Basis for Processing</h2>
          <p className="text-muted-foreground mb-3">We process personal data under the following lawful bases as defined by Article 6 of the GDPR:</p>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-secondary/30 rounded-lg border-l-2 border-gold/40">
              <h4 className="font-semibold text-foreground mb-1">Consent (Article 6(1)(a))</h4>
              <p className="text-muted-foreground text-xs">For newsletter subscriptions, marketing communications, and non-essential cookies. You may withdraw consent at any time.</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg border-l-2 border-gold/40">
              <h4 className="font-semibold text-foreground mb-1">Legitimate Interest (Article 6(1)(f))</h4>
              <p className="text-muted-foreground text-xs">For website analytics, security monitoring, and improving our editorial services. We conduct Legitimate Interest Assessments (LIAs) where required.</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg border-l-2 border-gold/40">
              <h4 className="font-semibold text-foreground mb-1">Contractual Necessity (Article 6(1)(b))</h4>
              <p className="text-muted-foreground text-xs">For processing advertising partnerships and service agreements.</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg border-l-2 border-gold/40">
              <h4 className="font-semibold text-foreground mb-1">Legal Obligation (Article 6(1)(c))</h4>
              <p className="text-muted-foreground text-xs">Where we are required by law to retain or disclose certain information.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">4. Your Data Rights</h2>
          <p className="text-muted-foreground mb-4">Under the GDPR, you have the following rights regarding your personal data:</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { title: "Right of Access", desc: "Request a copy of your personal data we hold" },
              { title: "Right to Rectification", desc: "Request correction of inaccurate personal data" },
              { title: "Right to Erasure", desc: "Request deletion of your personal data" },
              { title: "Right to Restrict", desc: "Request limitation of processing your data" },
              { title: "Right to Portability", desc: "Receive your data in a structured, machine-readable format" },
              { title: "Right to Object", desc: "Object to processing based on legitimate interests" },
              { title: "Right to Withdraw Consent", desc: "Withdraw consent at any time without affecting prior processing" },
              { title: "Right to Complain", desc: "Lodge a complaint with the ICO or relevant supervisory authority" },
            ].map((right) => (
              <div key={right.title} className="p-3 bg-secondary/20 rounded-lg border border-border/30">
                <h4 className="font-semibold text-foreground text-xs mb-1">{right.title}</h4>
                <p className="text-muted-foreground text-xs">{right.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">5. Data Processing Activities</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-foreground font-semibold">Activity</th>
                  <th className="text-left py-3 px-4 text-foreground font-semibold">Data Collected</th>
                  <th className="text-left py-3 px-4 text-foreground font-semibold">Lawful Basis</th>
                  <th className="text-left py-3 px-4 text-foreground font-semibold">Retention</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/30">
                  <td className="py-3 px-4">Contact Forms</td>
                  <td className="py-3 px-4">Name, email, message</td>
                  <td className="py-3 px-4">Consent</td>
                  <td className="py-3 px-4">24 months</td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="py-3 px-4">Website Analytics</td>
                  <td className="py-3 px-4">IP, browser, pages visited</td>
                  <td className="py-3 px-4">Legitimate Interest</td>
                  <td className="py-3 px-4">12 months</td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="py-3 px-4">Newsletter</td>
                  <td className="py-3 px-4">Email address</td>
                  <td className="py-3 px-4">Consent</td>
                  <td className="py-3 px-4">Until unsubscribed</td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="py-3 px-4">Advertising Enquiries</td>
                  <td className="py-3 px-4">Name, email, company, budget</td>
                  <td className="py-3 px-4">Contractual Necessity</td>
                  <td className="py-3 px-4">36 months</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">6. Data Protection Measures</h2>
          <p className="text-muted-foreground mb-3">We implement the following technical and organisational measures:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-4">
            <li>SSL/TLS encryption for all data in transit</li>
            <li>Encrypted data storage at rest</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Access controls and authentication mechanisms</li>
            <li>Staff training on data protection best practices</li>
            <li>Data minimisation principles applied across all processes</li>
            <li>Regular backup and disaster recovery procedures</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">7. International Data Transfers</h2>
          <p className="text-muted-foreground">
            Where personal data is transferred outside the UK or EEA, we ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) approved by the Information Commissioner's Office (ICO), or transfers to countries with an adequacy decision.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">8. Data Breach Procedures</h2>
          <p className="text-muted-foreground">
            In the event of a personal data breach, we will notify the Information Commissioner's Office (ICO) within 72 hours of becoming aware of the breach where it is likely to result in a risk to the rights and freedoms of individuals. Where the breach is likely to result in a high risk, we will also notify affected individuals without undue delay.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">9. How to Exercise Your Rights</h2>
          <p className="text-muted-foreground">
            To exercise any of your data protection rights, please submit a request to:
          </p>
          <div className="mt-3 p-4 bg-secondary/50 rounded-lg border border-border/50">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Data Protection Officer</strong><br />
              Vipat E Bllokut Ltd<br />
              125 Kingsway, Holborn<br />
              London WC2B 6NH, United Kingdom<br />
              Email: <a href="mailto:info@vipatebllokut.com" className="text-gold hover:text-gold-light transition-colors">info@vipatebllokut.com</a>
            </p>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            We will respond to your request within one month. In complex cases, this may be extended by a further two months, in which case we will inform you within the initial one-month period.
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            If you are not satisfied with our response, you have the right to lodge a complaint with the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-light transition-colors">ico.org.uk</a>.
          </p>
        </section>
      </div>
    </LegalPage>
  );
}
