import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | NexusBank',
  description:
    'How NexusBank Ltd collects, uses, stores, and protects your personal data in compliance with UK GDPR.',
}

export default function PrivacyPage() {
  return (
    <article>
      {/* ── Page heading ─────────────────────────────────────────────── */}
      <header className="mb-10">
        <div className="accent-bar mb-4" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Privacy Policy
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
            1. Data Controller
          </h2>
          <p>
            NexusBank Ltd (&quot;NexusBank&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is the data
            controller responsible for your personal data. We are registered in England
            and Wales (Company No. 00000000) with our registered office at 1 Nexus Square,
            London, EC2A 1BB.
          </p>
          <p className="mt-3">
            NexusBank is authorised by the Prudential Regulation Authority and regulated
            by the Financial Conduct Authority and the Prudential Regulation Authority
            (Financial Services Register number: 000000). We are registered with the
            Information Commissioner&apos;s Office (ICO) under registration number
            ZA000000.
          </p>
          <p className="mt-3">
            This Privacy Policy explains how we collect, use, disclose, and safeguard your
            personal data when you use our banking services, website, mobile application,
            and other products. It is prepared in accordance with the UK General Data
            Protection Regulation (UK GDPR) and the Data Protection Act 2018.
          </p>
        </section>

        {/* 2 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            2. Data We Collect
          </h2>
          <p>We may collect and process the following categories of personal data:</p>
          <ul className="mt-3 list-disc pl-6 space-y-1.5">
            <li>
              <strong>Identity data:</strong> full name, date of birth, gender, nationality,
              photograph, government-issued identification numbers (passport, driving licence).
            </li>
            <li>
              <strong>Contact data:</strong> residential address, email address, telephone
              numbers.
            </li>
            <li>
              <strong>Financial data:</strong> bank account details, transaction history,
              credit history, income information, tax identification numbers.
            </li>
            <li>
              <strong>Technical data:</strong> IP address, browser type and version, device
              identifiers, operating system, time zone settings, login data, and pages
              visited on our website and App.
            </li>
            <li>
              <strong>Usage data:</strong> information about how you use our website, App,
              and services, including features accessed and frequency of access.
            </li>
            <li>
              <strong>Communications data:</strong> records of correspondence with us,
              including phone calls (which may be recorded for training and compliance
              purposes), emails, secure messages, and chat transcripts.
            </li>
            <li>
              <strong>Special category data:</strong> in limited circumstances we may
              collect health-related data where you disclose a vulnerability or request
              reasonable adjustments, processed only with your explicit consent or as
              necessary to protect your vital interests.
            </li>
          </ul>
        </section>

        {/* 3 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            3. Legal Basis for Processing
          </h2>
          <p>
            We rely on the following lawful bases under Article 6 of UK GDPR to process
            your personal data:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-1.5">
            <li>
              <strong>Performance of a contract:</strong> processing necessary to provide
              you with banking services, manage your accounts, execute transactions, and
              fulfil our contractual obligations to you.
            </li>
            <li>
              <strong>Legal obligation:</strong> processing necessary to comply with UK law
              and regulation, including anti-money laundering requirements under the
              Proceeds of Crime Act 2002, the Money Laundering Regulations 2017, sanctions
              screening, tax reporting obligations (including HMRC and CRS/FATCA), and
              regulatory reporting to the FCA and PRA.
            </li>
            <li>
              <strong>Legitimate interests:</strong> processing necessary for our legitimate
              business interests, including fraud detection and prevention, system security,
              improving our products and services, internal analytics, and direct marketing
              of similar products (subject to your right to opt out).
            </li>
            <li>
              <strong>Consent:</strong> where you have given us specific consent to process
              your data for a particular purpose, such as receiving marketing communications
              from third-party partners. You may withdraw consent at any time without
              affecting the lawfulness of processing carried out prior to withdrawal.
            </li>
            <li>
              <strong>Vital interests:</strong> in exceptional circumstances, to protect
              your life or the life of another individual.
            </li>
          </ul>
        </section>

        {/* 4 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            4. How We Use Your Data
          </h2>
          <p>We use your personal data for the following purposes:</p>
          <ol className="mt-3 list-decimal pl-6 space-y-1.5">
            <li>
              Opening, administering, and closing your accounts, including identity
              verification and credit checks.
            </li>
            <li>
              Processing payments, direct debits, standing orders, and other financial
              transactions.
            </li>
            <li>
              Detecting, investigating, and preventing fraud, financial crime, and
              unauthorised account access.
            </li>
            <li>
              Complying with regulatory requirements, including suspicious activity
              reporting to the National Crime Agency.
            </li>
            <li>
              Communicating with you about your accounts, services, and any changes to our
              terms or policies.
            </li>
            <li>
              Providing customer support and resolving complaints.
            </li>
            <li>
              Improving and personalising our services, including through analytics,
              customer segmentation, and product development.
            </li>
            <li>
              Sending you marketing communications about our products and services where
              permitted by law or where you have opted in.
            </li>
            <li>
              Managing risk and conducting internal audits and stress testing as required
              by our regulators.
            </li>
          </ol>
        </section>

        {/* 5 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            5. Data Sharing
          </h2>
          <p>We may share your personal data with the following categories of recipients:</p>
          <ul className="mt-3 list-disc pl-6 space-y-1.5">
            <li>
              <strong>Regulatory and law enforcement bodies:</strong> the FCA, PRA, HMRC,
              the National Crime Agency, and other authorities where required by law.
            </li>
            <li>
              <strong>Credit reference agencies:</strong> Experian, Equifax, and
              TransUnion, for identity verification, credit assessments, and fraud
              prevention. Information shared with CRAs will be retained on your credit file.
            </li>
            <li>
              <strong>Fraud prevention agencies:</strong> including Cifas, to detect and
              prevent fraud and money laundering.
            </li>
            <li>
              <strong>Payment processors and card schemes:</strong> Visa, Mastercard, and
              Faster Payments, to execute your transactions.
            </li>
            <li>
              <strong>Service providers:</strong> third-party companies that provide IT
              infrastructure, cloud hosting, printing, and communication services on our
              behalf, all bound by contractual data processing agreements.
            </li>
            <li>
              <strong>Professional advisors:</strong> external auditors, lawyers, and
              consultants under obligations of confidentiality.
            </li>
            <li>
              <strong>Open Banking providers:</strong> where you have explicitly authorised
              a third-party provider to access your account information or initiate payments
              under the Payment Services Regulations 2017.
            </li>
          </ul>
          <p className="mt-3">
            We do not sell your personal data to third parties. Where we transfer data
            outside the United Kingdom, we ensure appropriate safeguards are in place,
            including Standard Contractual Clauses approved by the ICO or transfers to
            countries with an adequacy decision.
          </p>
        </section>

        {/* 6 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            6. Data Retention
          </h2>
          <p>
            We retain your personal data only for as long as is necessary to fulfil the
            purposes for which it was collected, or as required by applicable law and
            regulation. Key retention periods include:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-1.5">
            <li>
              <strong>Account data:</strong> for the duration of your relationship with us
              and a minimum of six years after account closure, in line with the Limitation
              Act 1980 and FCA record-keeping requirements.
            </li>
            <li>
              <strong>Transaction records:</strong> a minimum of six years from the date
              of the transaction, as required by HMRC and anti-money laundering regulations.
            </li>
            <li>
              <strong>Marketing preferences:</strong> until you withdraw consent or opt
              out, after which we will suppress your data to ensure we respect your choice.
            </li>
            <li>
              <strong>Complaint records:</strong> a minimum of three years from the date of
              final resolution, as required by FCA DISP rules.
            </li>
          </ul>
        </section>

        {/* 7 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            7. Your Rights
          </h2>
          <p>
            Under UK GDPR, you have the following rights in relation to your personal data.
            To exercise any of these rights, please contact our Data Protection Officer
            using the details below.
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-1.5">
            <li>
              <strong>Right of access (Article 15):</strong> you have the right to request
              a copy of the personal data we hold about you. We will respond to your
              request within one calendar month.
            </li>
            <li>
              <strong>Right to rectification (Article 16):</strong> you have the right to
              request that we correct inaccurate or incomplete personal data.
            </li>
            <li>
              <strong>Right to erasure (Article 17):</strong> you have the right to request
              deletion of your personal data where there is no compelling reason for us to
              continue processing it. This right is subject to legal retention requirements.
            </li>
            <li>
              <strong>Right to data portability (Article 20):</strong> you have the right
              to receive your personal data in a structured, commonly used, and
              machine-readable format and to transmit it to another controller.
            </li>
            <li>
              <strong>Right to object (Article 21):</strong> you have the right to object
              to processing based on legitimate interests, including profiling, and to
              direct marketing at any time.
            </li>
            <li>
              <strong>Right to restrict processing (Article 18):</strong> you have the
              right to request that we restrict processing of your data in certain
              circumstances, for example where you contest the accuracy of the data.
            </li>
            <li>
              <strong>Rights related to automated decision-making (Article 22):</strong>{' '}
              you have the right not to be subject to a decision based solely on automated
              processing, including profiling, which produces legal effects or similarly
              significantly affects you. Where we use automated credit scoring, you may
              request human intervention and challenge the decision.
            </li>
          </ul>
          <p className="mt-3">
            If you are dissatisfied with how we handle your personal data, you have the
            right to lodge a complaint with the Information Commissioner&apos;s Office
            (ICO) at{' '}
            <Link
              href="https://ico.org.uk"
              className="text-primary hover:underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              ico.org.uk
            </Link>{' '}
            or by calling 0303 123 1113.
          </p>
        </section>

        {/* 8 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            8. Cookies
          </h2>
          <p>
            Our website and App use cookies and similar tracking technologies to enhance
            your experience, analyse usage patterns, and deliver personalised content. For
            detailed information about the cookies we use, how to manage your preferences,
            and your choices, please refer to our{' '}
            <Link href="/cookies" className="text-primary hover:underline underline-offset-4">
              Cookie Policy
            </Link>.
          </p>
        </section>

        {/* 9 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            9. Contact the Data Protection Officer
          </h2>
          <div className="rounded-lg border border-border bg-card p-6 hover:border-primary transition-colors">
            <p className="mb-3">
              If you have any questions about this Privacy Policy or wish to exercise your
              data protection rights, please contact our Data Protection Officer:
            </p>
            <ul className="space-y-1.5">
              <li>
                <strong>Post:</strong> Data Protection Officer, NexusBank Ltd, 1 Nexus
                Square, London, EC2A 1BB
              </li>
              <li>
                <strong>Email:</strong>{' '}
                <Link href="mailto:dpo@nexusbank.co.uk" className="text-primary hover:underline underline-offset-4">
                  dpo@nexusbank.co.uk
                </Link>
              </li>
              <li>
                <strong>WhatsApp:</strong> +44 7365 192524
              </li>
            </ul>
            <p className="mt-3">
              We aim to respond to all data protection requests within one calendar month
              of receipt. In complex cases, we may extend this period by a further two
              months and will inform you accordingly.
            </p>
          </div>
        </section>
      </div>
    </article>
  )
}
