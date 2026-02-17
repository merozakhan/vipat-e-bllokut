import LegalPage from "@/components/LegalPage";

export default function EditorialPolicy() {
  return (
    <LegalPage
      title="Editorial Policy"
      subtitle="Our commitment to journalistic integrity, accuracy, and ethical reporting standards."
      lastUpdated="17 February 2026"
    >
      <div className="space-y-8 text-card-foreground font-sans text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">1. Our Mission</h2>
          <p className="text-muted-foreground">
            Vipat E Bllokut is committed to delivering accurate, fair, and comprehensive news coverage for Albania and the Albanian diaspora worldwide. Our editorial team adheres to the highest standards of journalism, ensuring that every story we publish serves the public interest and upholds the principles of truth and transparency.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">2. Editorial Independence</h2>
          <p className="text-muted-foreground">
            Our editorial decisions are made independently of commercial, political, or other external influences. Advertisers, sponsors, and partners have no influence over our editorial content. Our newsroom operates with full editorial independence, and our journalists are free to pursue stories based on their news value and public interest.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">3. Accuracy and Fact-Checking</h2>
          <p className="text-muted-foreground">
            We are committed to accuracy in all our reporting. Our editorial process includes rigorous fact-checking procedures. When errors are identified, we correct them promptly and transparently. We clearly distinguish between news reporting, analysis, opinion, and sponsored content.
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-4 mt-3">
            <li>All facts are verified through multiple sources where possible</li>
            <li>Direct quotes are accurately attributed and verified</li>
            <li>Statistics and data are sourced from reliable institutions</li>
            <li>Corrections are published promptly when errors are discovered</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">4. Fairness and Balance</h2>
          <p className="text-muted-foreground">
            We strive to present all sides of a story fairly and without bias. When covering controversial topics, we seek comment from all relevant parties. We do not allow personal opinions to influence our news reporting. Where a story involves allegations, we give the subject of those allegations a reasonable opportunity to respond.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">5. Sources and Attribution</h2>
          <p className="text-muted-foreground">
            We attribute information to its source wherever possible. We protect the identity of confidential sources when necessary to safeguard their safety or livelihood. Anonymous sources are used only when the information is of significant public interest and cannot be obtained through other means.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">6. Corrections Policy</h2>
          <p className="text-muted-foreground">
            When we make an error, we correct it as quickly as possible. Corrections are clearly marked and appended to the original article. Significant corrections are noted at the top of the article. We do not silently alter published content without disclosure.
          </p>
          <p className="text-muted-foreground mt-3">
            To report an error or request a correction, please contact our editorial team at <a href="mailto:info@vipatebllokut.com" className="text-gold hover:text-gold-light transition-colors">info@vipatebllokut.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">7. Content Categories</h2>
          <p className="text-muted-foreground mb-3">We clearly label different types of content:</p>
          <div className="space-y-3">
            <div className="p-3 bg-secondary/30 rounded-lg border-l-2 border-gold/40">
              <h4 className="font-semibold text-foreground text-xs mb-1">News</h4>
              <p className="text-muted-foreground text-xs">Factual reporting of events, verified through multiple sources</p>
            </div>
            <div className="p-3 bg-secondary/30 rounded-lg border-l-2 border-gold/40">
              <h4 className="font-semibold text-foreground text-xs mb-1">Analysis</h4>
              <p className="text-muted-foreground text-xs">In-depth examination of issues, providing context and expert interpretation</p>
            </div>
            <div className="p-3 bg-secondary/30 rounded-lg border-l-2 border-gold/40">
              <h4 className="font-semibold text-foreground text-xs mb-1">Opinion</h4>
              <p className="text-muted-foreground text-xs">Personal viewpoints of columnists, clearly marked as opinion</p>
            </div>
            <div className="p-3 bg-secondary/30 rounded-lg border-l-2 border-gold/40">
              <h4 className="font-semibold text-foreground text-xs mb-1">Sponsored Content</h4>
              <p className="text-muted-foreground text-xs">Content created in partnership with advertisers, always clearly labelled</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">8. Complaints</h2>
          <p className="text-muted-foreground">
            We take all editorial complaints seriously. If you believe our coverage has been inaccurate, unfair, or in breach of our editorial standards, please contact us at <a href="mailto:info@vipatebllokut.com" className="text-gold hover:text-gold-light transition-colors">info@vipatebllokut.com</a>. We will investigate all complaints and respond within 14 working days.
          </p>
        </section>
      </div>
    </LegalPage>
  );
}
