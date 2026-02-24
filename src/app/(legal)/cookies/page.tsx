import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookie Policy | NexusBank',
  description:
    'How NexusBank uses cookies and similar technologies on our website and mobile application.',
}

export default function CookiesPage() {
  return (
    <article>
      {/* ── Page heading ─────────────────────────────────────────────── */}
      <header className="mb-10">
        <div className="accent-bar mb-4" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Cookie Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: February 2026
        </p>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="space-y-10 text-sm leading-relaxed text-foreground/80">
        {/* 1 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            1. What Are Cookies
          </h2>
          <p>
            Cookies are small text files that are placed on your device (computer, tablet,
            or mobile phone) when you visit a website. They are widely used to make
            websites work more efficiently, to provide a better user experience, and to
            supply information to the owners of the website.
          </p>
          <p className="mt-3">
            Cookies may be set by the website you are visiting (&quot;first-party
            cookies&quot;) or by third parties whose content appears on the page
            (&quot;third-party cookies&quot;). Cookies can remain on your device for
            different periods of time. &quot;Session cookies&quot; are temporary and are
            deleted when you close your browser. &quot;Persistent cookies&quot; remain on
            your device for a set period or until you delete them manually.
          </p>
          <p className="mt-3">
            This Cookie Policy explains what cookies NexusBank Ltd (&quot;NexusBank&quot;,
            &quot;we&quot;, &quot;us&quot;) uses on our website (www.nexusbank.co.uk) and
            mobile application, why we use them, and how you can manage your preferences.
            This policy should be read alongside our{' '}
            <Link href="/privacy" className="text-primary hover:underline underline-offset-4">
              Privacy Policy
            </Link>, which provides further detail on how we process your personal data.
          </p>
        </section>

        {/* 2 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            2. Cookies We Use
          </h2>
          <p>
            We categorise our cookies into four groups based on their purpose. When you
            first visit our website, we will ask for your consent to set non-essential
            cookies via our cookie consent banner.
          </p>

          {/* 2.1 */}
          <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
            2.1 Strictly Necessary Cookies
          </h3>
          <p>
            These cookies are essential for the operation of our website and online banking
            platform. They enable core functionality such as security, session management,
            and accessibility. Without these cookies, services you have requested cannot be
            provided. Strictly necessary cookies do not require your consent.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 font-semibold text-foreground">Cookie</th>
                  <th className="py-2 pr-4 font-semibold text-foreground">Purpose</th>
                  <th className="py-2 font-semibold text-foreground">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">nb_session</td>
                  <td className="py-2 pr-4">Maintains your authenticated session</td>
                  <td className="py-2">Session</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">nb_csrf</td>
                  <td className="py-2 pr-4">
                    Protects against cross-site request forgery attacks
                  </td>
                  <td className="py-2">Session</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">nb_cookie_consent</td>
                  <td className="py-2 pr-4">Stores your cookie preference selections</td>
                  <td className="py-2">12 months</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">nb_sca_token</td>
                  <td className="py-2 pr-4">
                    Supports Strong Customer Authentication flows
                  </td>
                  <td className="py-2">5 minutes</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2.2 */}
          <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
            2.2 Functional Cookies
          </h3>
          <p>
            These cookies allow our website to remember choices you make (such as your
            preferred language, region, or display settings) and provide enhanced, more
            personalised features. They may also be used to provide services you have
            requested, such as watching a video or commenting on a blog.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 font-semibold text-foreground">Cookie</th>
                  <th className="py-2 pr-4 font-semibold text-foreground">Purpose</th>
                  <th className="py-2 font-semibold text-foreground">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">nb_theme</td>
                  <td className="py-2 pr-4">
                    Remembers your light/dark mode preference
                  </td>
                  <td className="py-2">12 months</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">nb_locale</td>
                  <td className="py-2 pr-4">Stores your language and region settings</td>
                  <td className="py-2">12 months</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">nb_a11y</td>
                  <td className="py-2 pr-4">
                    Retains accessibility preferences (font size, reduced motion)
                  </td>
                  <td className="py-2">12 months</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2.3 */}
          <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
            2.3 Analytics Cookies
          </h3>
          <p>
            These cookies collect information about how visitors use our website, including
            which pages are visited most often, how visitors move around the site, and
            whether they experience error messages. All information collected by these
            cookies is aggregated and therefore anonymous. We use this data to improve how
            our website works.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 font-semibold text-foreground">Cookie</th>
                  <th className="py-2 pr-4 font-semibold text-foreground">Purpose</th>
                  <th className="py-2 font-semibold text-foreground">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">_nb_analytics</td>
                  <td className="py-2 pr-4">
                    Tracks page views and user journeys (first-party)
                  </td>
                  <td className="py-2">24 months</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">_nb_perf</td>
                  <td className="py-2 pr-4">
                    Monitors page load times and performance metrics
                  </td>
                  <td className="py-2">Session</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2.4 */}
          <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
            2.4 Marketing Cookies
          </h3>
          <p>
            These cookies are used to deliver adverts that are more relevant to you and
            your interests. They are also used to limit the number of times you see an
            advertisement and to help measure the effectiveness of advertising campaigns.
            They are usually placed by third-party advertising networks with our
            permission.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 font-semibold text-foreground">Cookie</th>
                  <th className="py-2 pr-4 font-semibold text-foreground">Purpose</th>
                  <th className="py-2 font-semibold text-foreground">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">_nb_mkt</td>
                  <td className="py-2 pr-4">
                    Tracks campaign attribution and conversion measurement
                  </td>
                  <td className="py-2">6 months</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">_nb_social</td>
                  <td className="py-2 pr-4">
                    Enables social media sharing features
                  </td>
                  <td className="py-2">12 months</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            3. How to Manage Cookies
          </h2>
          <p>
            You can control and manage cookies in several ways. Please be aware that
            removing or blocking cookies may impact your user experience and some
            functionality may no longer be available.
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-1.5">
            <li>
              <strong>Cookie consent banner:</strong> when you first visit our website, you
              can choose which categories of non-essential cookies to accept or reject. You
              can change your preferences at any time by clicking the &quot;Cookie
              Settings&quot; link in the footer of any page.
            </li>
            <li>
              <strong>Browser settings:</strong> most browsers allow you to view, manage,
              and delete cookies through their settings. You can set your browser to block
              all cookies or to alert you when a cookie is being set. Refer to your
              browser&apos;s help documentation for instructions.
            </li>
            <li>
              <strong>Device settings:</strong> on mobile devices, you can manage cookie
              and tracking preferences through your device&apos;s operating system settings.
            </li>
            <li>
              <strong>Industry opt-out tools:</strong> you can opt out of certain
              third-party advertising cookies by visiting the Network Advertising Initiative
              at optout.networkadvertising.org or the Digital Advertising Alliance at
              youronlinechoices.eu.
            </li>
          </ul>
          <p className="mt-3">
            If you disable strictly necessary cookies, you may not be able to access our
            online banking services. We recommend keeping these cookies enabled.
          </p>
        </section>

        {/* 4 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            4. Third-Party Cookies
          </h2>
          <p>
            Some cookies on our website are set by third-party services that appear on our
            pages. We do not control the setting of these cookies. The third parties that
            set cookies on our site may include:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-1.5">
            <li>
              <strong>Analytics providers</strong> that help us understand how visitors use
              our website through aggregated, anonymised reporting.
            </li>
            <li>
              <strong>Video hosting platforms</strong> that enable us to embed educational
              and promotional videos on our website.
            </li>
            <li>
              <strong>Social media platforms</strong> that enable sharing buttons and
              social content feeds.
            </li>
            <li>
              <strong>Fraud detection services</strong> that assist us in identifying
              suspicious activity and protecting our customers.
            </li>
          </ul>
          <p className="mt-3">
            We recommend reviewing the privacy policies and cookie policies of these third
            parties to understand how they use your data. NexusBank is not responsible for
            the cookie practices of external websites.
          </p>
        </section>

        {/* 5 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            5. Changes to This Cookie Policy
          </h2>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in
            technology, legislation, our business operations, or cookie practices. When we
            make material changes, we will update the &quot;Last updated&quot; date at the
            top of this page and, where appropriate, notify you via our cookie consent
            banner so that you can review and update your preferences.
          </p>
          <p className="mt-3">
            We encourage you to review this policy periodically to stay informed about how
            we use cookies. Your continued use of our website after changes are posted
            constitutes your acknowledgement of the modified policy.
          </p>
        </section>

        {/* ── Contact box ──────────────────────────────────────────────── */}
        <section className="rounded-lg border border-border bg-card p-6 hover:border-primary transition-colors">
          <h3 className="text-base font-semibold text-foreground mb-2">
            Questions about cookies?
          </h3>
          <p>
            If you have any questions about our use of cookies or other tracking
            technologies, please contact our Data Protection Officer at{' '}
            <Link href="mailto:dpo@nexusbank.co.uk" className="text-primary hover:underline underline-offset-4">
              dpo@nexusbank.co.uk
            </Link>{' '}
            or write to: Data Protection Officer, NexusBank Ltd, 1 Nexus Square, London,
            EC2A 1BB.
          </p>
        </section>
      </div>
    </article>
  )
}
