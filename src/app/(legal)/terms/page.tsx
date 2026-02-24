import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms & Conditions | NexusBank',
  description:
    'Terms and conditions governing your use of NexusBank accounts, online banking, and related services.',
}

export default function TermsPage() {
  return (
    <article>
      {/* ── Page heading ─────────────────────────────────────────────── */}
      <header className="mb-10">
        <div className="accent-bar mb-4" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Terms &amp; Conditions
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
            1. Introduction
          </h2>
          <p>
            These Terms and Conditions (&quot;Terms&quot;) form a legally binding agreement
            between you (&quot;Customer&quot;, &quot;you&quot;) and NexusBank Ltd (&quot;NexusBank&quot;,
            &quot;we&quot;, &quot;us&quot;, &quot;our&quot;), a company registered in England and Wales (Company
            No. 00000000) with its registered office at 1 Nexus Square, London, EC2A 1BB.
          </p>
          <p className="mt-3">
            NexusBank Ltd is authorised by the Prudential Regulation Authority (&quot;PRA&quot;)
            and regulated by the Financial Conduct Authority (&quot;FCA&quot;) and the PRA under
            Financial Services Register number 000000. By opening an account or using any
            of our services, you confirm that you have read, understood, and agree to be
            bound by these Terms.
          </p>
          <p className="mt-3">
            These Terms apply to all personal current accounts, savings accounts, and
            digital banking services offered by NexusBank. Separate terms may apply to
            credit cards, loans, mortgages, and investment products, and those terms will
            be provided to you before you enter into any such agreement.
          </p>
        </section>

        {/* 2 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            2. Account Types
          </h2>
          <p>NexusBank offers the following personal account types:</p>
          <ul className="mt-3 list-disc pl-6 space-y-1.5">
            <li>
              <strong>Everyday Current Account</strong> — a fee-free current account with
              a Visa debit card, contactless payments, and full access to online and mobile
              banking.
            </li>
            <li>
              <strong>Nexus Edge Account</strong> — a premium current account offering
              cashback on selected household bills, worldwide travel insurance, and
              preferential savings rates. A monthly fee of £5 applies.
            </li>
            <li>
              <strong>Nexus Edge Up Account</strong> — our top-tier account providing
              enhanced cashback, comprehensive family travel insurance, airport lounge
              access, and a dedicated relationship manager. A monthly fee of £15 applies.
            </li>
            <li>
              <strong>Easy Access Savings</strong> — a variable-rate savings account
              allowing unlimited withdrawals with no notice period.
            </li>
            <li>
              <strong>Cash ISA</strong> — a tax-efficient savings account allowing you to
              save up to the annual ISA allowance free of UK income tax on interest earned.
            </li>
            <li>
              <strong>Fixed Rate Bond</strong> — a savings product offering a guaranteed
              interest rate for a fixed term of 1, 2, 3, or 5 years. Early withdrawal is
              not permitted except in cases of financial hardship.
            </li>
          </ul>
          <p className="mt-3">
            Full details of each account, including interest rates and any applicable fees,
            are set out in the relevant product summary sheets, which form part of these
            Terms.
          </p>
        </section>

        {/* 3 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            3. Eligibility
          </h2>
          <p>To open a NexusBank account you must:</p>
          <ol className="mt-3 list-decimal pl-6 space-y-1.5">
            <li>be at least 18 years of age (or 16 for a Basic Current Account);</li>
            <li>be resident in the United Kingdom;</li>
            <li>
              provide valid government-issued photographic identification (passport or
              driving licence) and proof of address dated within the last three months;
            </li>
            <li>
              pass our identity verification, anti-money laundering, and
              know-your-customer checks as required by the Money Laundering, Terrorist
              Financing and Transfer of Funds (Information on the Payer) Regulations 2017;
            </li>
            <li>
              not have been declared bankrupt or subject to an Individual Voluntary
              Arrangement (IVA) where the order has not been discharged.
            </li>
          </ol>
          <p className="mt-3">
            We reserve the right to decline any application at our sole discretion and
            without providing a reason, subject to applicable law.
          </p>
        </section>

        {/* 4 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            4. Fees &amp; Charges
          </h2>
          <p>
            A full schedule of our current fees and charges is available in our Tariff of
            Charges document, which can be accessed on our website, in the mobile app, or
            by requesting a copy from any NexusBank branch or by calling 0800 123 4567.
            Key fees include:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-1.5">
            <li>
              <strong>Arranged overdraft:</strong> 15.9% EAR (variable). No daily or
              monthly overdraft fees apply.
            </li>
            <li>
              <strong>Unarranged overdraft:</strong> We will not charge you for going into
              an unarranged overdraft, but we may return unpaid items and this could affect
              your credit score.
            </li>
            <li>
              <strong>Foreign transactions:</strong> A non-sterling transaction fee of
              2.75% applies to debit card transactions made outside the UK. Nexus Edge and
              Nexus Edge Up accounts are exempt from this fee.
            </li>
            <li>
              <strong>Cash withdrawals abroad:</strong> £1.50 per withdrawal (free for
              Nexus Edge Up account holders).
            </li>
            <li>
              <strong>Replacement debit card:</strong> Free for lost/stolen (first
              replacement per year); £5 for additional replacements.
            </li>
            <li>
              <strong>CHAPS payment:</strong> £25 per payment.
            </li>
          </ul>
          <p className="mt-3">
            We will give you at least 60 days&apos; personal notice before making any
            change to our fees, charges, or interest rates that is to your disadvantage.
          </p>
        </section>

        {/* 5 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            5. Online &amp; Mobile Banking
          </h2>
          <p>
            NexusBank provides online banking via our website and the NexusBank mobile
            application (&quot;the App&quot;). By using our digital services you agree to:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-1.5">
            <li>
              keep your login credentials, including your Customer ID, password, and any
              one-time passcodes, confidential and not share them with any third party;
            </li>
            <li>
              use Strong Customer Authentication (SCA) as required by the Payment Services
              Regulations 2017 when accessing your account or making electronic payments;
            </li>
            <li>
              ensure that any device used to access online or mobile banking is kept secure
              with up-to-date operating system software and antivirus protection;
            </li>
            <li>
              notify us immediately if you believe your login credentials have been
              compromised or if you identify any unauthorised transaction on your account.
            </li>
          </ul>
          <p className="mt-3">
            We may suspend your access to online or mobile banking without notice where we
            reasonably believe there has been, or is likely to be, unauthorised or
            fraudulent use of your account.
          </p>
        </section>

        {/* 6 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            6. Security Obligations
          </h2>
          <p>You must take all reasonable steps to keep your account secure. This includes:</p>
          <ol className="mt-3 list-decimal pl-6 space-y-1.5">
            <li>
              Never disclosing your full password, PIN, or one-time passcode to anyone,
              including NexusBank staff. We will never ask you for your full password.
            </li>
            <li>
              Contacting us on 0800 123 4567 immediately if your card is lost, stolen, or
              you suspect unauthorised use. You can also freeze your card instantly through
              the App.
            </li>
            <li>
              Reviewing your statements and transaction history regularly and reporting any
              unrecognised transactions within 13 months of the transaction date.
            </li>
            <li>
              Not responding to unsolicited communications (phishing emails, texts, or
              calls) that ask you to provide account or security information.
            </li>
          </ol>
          <p className="mt-3">
            Subject to the Payment Services Regulations 2017, you will not be liable for
            losses resulting from unauthorised transactions unless you have acted
            fraudulently or with gross negligence in safeguarding your security credentials.
          </p>
        </section>

        {/* 7 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            7. Intellectual Property
          </h2>
          <p>
            All content, trademarks, logos, software, and materials available through the
            NexusBank website and App are owned by or licensed to NexusBank Ltd and are
            protected by copyright, trademark, and other intellectual property laws of the
            United Kingdom and international jurisdictions.
          </p>
          <p className="mt-3">
            You may not reproduce, distribute, modify, create derivative works from, or
            publicly display any content from our services without our prior written
            consent, except as strictly necessary for your personal use of the banking
            services. The NexusBank name, logo, and all related product and service names
            are trademarks of NexusBank Ltd.
          </p>
        </section>

        {/* 8 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            8. Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by applicable law, NexusBank shall not be
            liable for any indirect, incidental, special, consequential, or punitive
            damages, including loss of profits, data, or business opportunity, arising out
            of or in connection with your use of our services.
          </p>
          <p className="mt-3">
            Nothing in these Terms excludes or limits our liability for death or personal
            injury caused by our negligence, fraud or fraudulent misrepresentation, or any
            other liability that cannot be excluded or limited under applicable law,
            including liability under the Financial Services and Markets Act 2000.
          </p>
          <p className="mt-3">
            We shall not be liable for any failure or delay in performing our obligations
            where such failure or delay results from circumstances beyond our reasonable
            control, including but not limited to acts of God, industrial action, failure
            of third-party systems, or government action.
          </p>
        </section>

        {/* 9 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            9. Complaints
          </h2>
          <p>
            If you are unhappy with any aspect of our service, we want to hear from you.
            You can make a complaint by:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-1.5">
            <li>
              calling our dedicated complaints line on <strong>0800 123 4568</strong>;
            </li>
            <li>
              emailing{' '}
              <Link href="mailto:complaints@nexusbank.co.uk" className="text-primary hover:underline underline-offset-4">
                complaints@nexusbank.co.uk
              </Link>;
            </li>
            <li>
              writing to: Customer Relations, NexusBank Ltd, 1 Nexus Square, London,
              EC2A 1BB;
            </li>
            <li>speaking to any member of staff at a NexusBank branch.</li>
          </ul>
          <p className="mt-3">
            We aim to resolve complaints within three business days. If we are unable to
            do so, we will send you a written acknowledgement and aim to provide a final
            response within eight weeks. If you remain dissatisfied, you may refer your
            complaint to the Financial Ombudsman Service. For further details, see our{' '}
            <Link href="/complaints" className="text-primary hover:underline underline-offset-4">
              Complaints Procedure
            </Link>.
          </p>
        </section>

        {/* 10 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            10. Governing Law
          </h2>
          <p>
            These Terms, and any dispute or claim arising out of or in connection with them
            (including non-contractual disputes or claims), shall be governed by and
            construed in accordance with the laws of England and Wales. The courts of
            England and Wales shall have exclusive jurisdiction, save that nothing in these
            Terms prevents you from bringing proceedings in the courts of Scotland or
            Northern Ireland if you live in those jurisdictions.
          </p>
          <p className="mt-3">
            If any provision of these Terms is found by a court of competent jurisdiction
            to be invalid, illegal, or unenforceable, the remaining provisions shall
            continue in full force and effect. Our failure to enforce any right or
            provision of these Terms shall not constitute a waiver of such right or
            provision.
          </p>
          <p className="mt-3">
            We may amend these Terms at any time. Where changes are to your disadvantage
            we will provide you with at least 60 days&apos; written notice. Continued use
            of our services after the changes take effect constitutes acceptance of the
            revised Terms.
          </p>
        </section>

        {/* ── Contact box ──────────────────────────────────────────────── */}
        <section className="rounded-lg border border-border bg-card p-6 hover:border-primary transition-colors">
          <h3 className="text-base font-semibold text-foreground mb-2">
            Questions about these Terms?
          </h3>
          <p>
            Contact our Customer Services team on{' '}
            <strong>0800 123 4567</strong> (Monday to Friday, 8am&ndash;8pm;
            Saturday 9am&ndash;5pm) or email{' '}
            <Link href="mailto:help@nexusbank.co.uk" className="text-primary hover:underline underline-offset-4">
              help@nexusbank.co.uk
            </Link>.
          </p>
        </section>
      </div>
    </article>
  )
}
