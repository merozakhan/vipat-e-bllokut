import LegalPage from "@/components/LegalPage";

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="Your privacy is important to us. This policy explains how Vipat E Bllokut Ltd collects, uses, and protects your personal information."
      lastUpdated="17 February 2026"
    >
      <div className="space-y-8 text-card-foreground font-sans text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">1. Introduction</h2>
          <p className="text-muted-foreground">
            Vipat E Bllokut Ltd ("we", "our", "us") is a company registered in England and Wales with its registered office at 125 Kingsway, Holborn, London WC2B 6NH, United Kingdom. We are committed to protecting and respecting your privacy in accordance with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, and other applicable data protection legislation.
          </p>
          <p className="text-muted-foreground mt-3">
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">2. Information We Collect</h2>
          <h3 className="text-base font-semibold text-foreground mb-2">2.1 Personal Data</h3>
          <p className="text-muted-foreground mb-3">We may collect the following personal information:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-4">
            <li>Name and contact information (email address, phone number)</li>
            <li>Company or organisation name</li>
            <li>Information provided through our contact forms</li>
            <li>Communication preferences</li>
            <li>Any other information you voluntarily provide to us</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mb-2 mt-4">2.2 Automatically Collected Data</h3>
          <p className="text-muted-foreground mb-3">When you visit our website, we may automatically collect:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-4">
            <li>IP address and browser type</li>
            <li>Device information and operating system</li>
            <li>Pages visited and time spent on each page</li>
            <li>Referring website addresses</li>
            <li>Geographic location (country/city level)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">3. How We Use Your Information</h2>
          <p className="text-muted-foreground mb-3">We use the information we collect to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-4">
            <li>Provide, operate, and maintain our website and news services</li>
            <li>Respond to your enquiries and fulfil your requests</li>
            <li>Send you news updates and editorial content (with your consent)</li>
            <li>Improve our website and user experience</li>
            <li>Analyse usage patterns and website performance</li>
            <li>Comply with legal obligations and protect our rights</li>
            <li>Process advertising and partnership enquiries</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">4. Legal Basis for Processing</h2>
          <p className="text-muted-foreground">Under the UK GDPR, we process your personal data on the following legal bases:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-4 mt-3">
            <li><strong className="text-foreground">Consent:</strong> Where you have given us explicit consent to process your data</li>
            <li><strong className="text-foreground">Legitimate Interests:</strong> Where processing is necessary for our legitimate business interests</li>
            <li><strong className="text-foreground">Contractual Necessity:</strong> Where processing is necessary to fulfil a contract with you</li>
            <li><strong className="text-foreground">Legal Obligation:</strong> Where we are required to process data by law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">5. Data Sharing and Disclosure</h2>
          <p className="text-muted-foreground">
            We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website and conducting our business, provided they agree to keep your information confidential. We may also disclose your information when required by law or to protect our rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">6. Data Retention</h2>
          <p className="text-muted-foreground">
            We retain your personal data only for as long as necessary to fulfil the purposes for which it was collected, including to satisfy any legal, accounting, or reporting requirements. Contact form submissions are retained for up to 24 months unless you request earlier deletion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">7. Your Rights</h2>
          <p className="text-muted-foreground mb-3">Under the UK GDPR, you have the following rights:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-4">
            <li>Right of access to your personal data</li>
            <li>Right to rectification of inaccurate data</li>
            <li>Right to erasure ("right to be forgotten")</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
            <li>Rights related to automated decision-making</li>
          </ul>
          <p className="text-muted-foreground mt-3">
            To exercise any of these rights, please contact us at <a href="mailto:info@vipatebllokut.com" className="text-gold hover:text-gold-light transition-colors">info@vipatebllokut.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">8. International Transfers</h2>
          <p className="text-muted-foreground">
            Your information may be transferred to and maintained on servers located outside of the United Kingdom. We ensure that any such transfers comply with applicable data protection laws and that appropriate safeguards are in place to protect your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">9. Security</h2>
          <p className="text-muted-foreground">
            We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">10. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="mt-3 p-4 bg-secondary/50 rounded-lg border border-border/50">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Vipat E Bllokut Ltd</strong><br />
              125 Kingsway, Holborn<br />
              London WC2B 6NH, United Kingdom<br />
              Email: <a href="mailto:info@vipatebllokut.com" className="text-gold hover:text-gold-light transition-colors">info@vipatebllokut.com</a><br />
              Phone: +44 7476 921815
            </p>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            You also have the right to lodge a complaint with the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-light transition-colors">ico.org.uk</a>.
          </p>
        </section>
      </div>
    </LegalPage>
  );
}
