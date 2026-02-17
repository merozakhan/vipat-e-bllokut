import LegalPage from "@/components/LegalPage";

export default function CookiePolicy() {
  return (
    <LegalPage
      title="Cookie Policy"
      subtitle="This policy explains how Vipat E Bllokut uses cookies and similar technologies on our website."
      lastUpdated="17 February 2026"
    >
      <div className="space-y-8 text-card-foreground font-sans text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">1. What Are Cookies?</h2>
          <p className="text-muted-foreground">
            Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently, as well as to provide information to the owners of the site. Cookies help us improve your experience on our website and understand how it is being used.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">2. Types of Cookies We Use</h2>
          <div className="space-y-4">
            <div className="p-4 bg-secondary/30 rounded-lg border-l-2 border-gold/40">
              <h4 className="font-semibold text-foreground mb-2">Essential Cookies</h4>
              <p className="text-muted-foreground text-xs mb-2">These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gold/10 text-gold text-xs rounded font-semibold">Required</span>
                <span className="text-xs text-muted-foreground">Cannot be disabled</span>
              </div>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg border-l-2 border-gold/40">
              <h4 className="font-semibold text-foreground mb-2">Analytics Cookies</h4>
              <p className="text-muted-foreground text-xs mb-2">These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve the website.</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-xs rounded font-semibold">Optional</span>
                <span className="text-xs text-muted-foreground">Can be disabled</span>
              </div>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg border-l-2 border-gold/40">
              <h4 className="font-semibold text-foreground mb-2">Functional Cookies</h4>
              <p className="text-muted-foreground text-xs mb-2">These cookies enable enhanced functionality and personalisation, such as remembering your preferences and settings.</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-xs rounded font-semibold">Optional</span>
                <span className="text-xs text-muted-foreground">Can be disabled</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">3. Specific Cookies We Use</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-foreground font-semibold">Cookie Name</th>
                  <th className="text-left py-3 px-4 text-foreground font-semibold">Type</th>
                  <th className="text-left py-3 px-4 text-foreground font-semibold">Purpose</th>
                  <th className="text-left py-3 px-4 text-foreground font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/30">
                  <td className="py-3 px-4 font-mono text-xs">session_token</td>
                  <td className="py-3 px-4">Essential</td>
                  <td className="py-3 px-4">Maintains user session</td>
                  <td className="py-3 px-4">Session</td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="py-3 px-4 font-mono text-xs">cookie_consent</td>
                  <td className="py-3 px-4">Essential</td>
                  <td className="py-3 px-4">Stores cookie preferences</td>
                  <td className="py-3 px-4">12 months</td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="py-3 px-4 font-mono text-xs">_analytics</td>
                  <td className="py-3 px-4">Analytics</td>
                  <td className="py-3 px-4">Website usage tracking</td>
                  <td className="py-3 px-4">12 months</td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="py-3 px-4 font-mono text-xs">theme_pref</td>
                  <td className="py-3 px-4">Functional</td>
                  <td className="py-3 px-4">Stores display preferences</td>
                  <td className="py-3 px-4">12 months</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">4. Managing Cookies</h2>
          <p className="text-muted-foreground mb-3">
            You can control and manage cookies in several ways. Please note that removing or blocking cookies may impact your user experience and parts of the website may no longer be fully accessible.
          </p>
          <h3 className="text-base font-semibold text-foreground mb-2">Browser Settings</h3>
          <p className="text-muted-foreground mb-3">
            Most browsers allow you to manage cookie settings. You can set your browser to refuse cookies, or to alert you when cookies are being sent. The following links provide instructions for popular browsers:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-4">
            <li>Google Chrome: Settings &gt; Privacy and Security &gt; Cookies</li>
            <li>Mozilla Firefox: Settings &gt; Privacy &amp; Security &gt; Cookies</li>
            <li>Safari: Preferences &gt; Privacy</li>
            <li>Microsoft Edge: Settings &gt; Cookies and Site Permissions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">5. Third-Party Cookies</h2>
          <p className="text-muted-foreground">
            Some cookies on our website are set by third-party services that appear on our pages. We do not control the setting of these cookies. Third-party cookies may include analytics services and social media platforms. Please refer to the respective third-party privacy policies for more information about their cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">6. Updates to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We encourage you to periodically review this page for the latest information on our cookie practices.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">7. Contact Us</h2>
          <p className="text-muted-foreground">If you have any questions about our use of cookies, please contact us:</p>
          <div className="mt-3 p-4 bg-secondary/50 rounded-lg border border-border/50">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Vipat E Bllokut Ltd</strong><br />
              125 Kingsway, Holborn<br />
              London WC2B 6NH, United Kingdom<br />
              Email: <a href="mailto:info@vipatebllokut.com" className="text-gold hover:text-gold-light transition-colors">info@vipatebllokut.com</a><br />
              Phone: +44 7476 921815
            </p>
          </div>
        </section>
      </div>
    </LegalPage>
  );
}
