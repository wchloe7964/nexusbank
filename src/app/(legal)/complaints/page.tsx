import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Complaints Procedure | NexusBank',
  description:
    'How to make a complaint about NexusBank services, our resolution process, timescales, and the Financial Ombudsman Service.',
}

export default function ComplaintsPage() {
  return (
    <article>
      {/* ── Page heading ─────────────────────────────────────────────── */}
      <header className="mb-10">
        <div className="accent-bar mb-4" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Complaints Procedure
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: February 2026
        </p>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="space-y-10 text-sm leading-relaxed text-foreground/80">
        {/* Intro */}
        <section>
          <p>
            NexusBank Ltd (&quot;NexusBank&quot;, &quot;we&quot;, &quot;us&quot;) is
            committed to providing the highest standard of service. However, we recognise
            that there may be occasions when things go wrong and you may wish to complain.
            We treat all complaints seriously and will do our best to resolve your concerns
            quickly and fairly.
          </p>
          <p className="mt-3">
            This Complaints Procedure explains how you can raise a complaint, what will
            happen once we receive it, the timescales we work to, and how to escalate your
            complaint to the Financial Ombudsman Service if you remain dissatisfied. This
            procedure is published in accordance with the Financial Conduct
            Authority&apos;s Dispute Resolution rules (DISP) in the FCA Handbook.
          </p>
        </section>

        {/* 1 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            1. How to Make a Complaint
          </h2>
          <p>
            You can make a complaint about any aspect of our products or services using
            any of the following methods:
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5 hover:border-primary transition-colors">
              <h3 className="text-sm font-semibold text-foreground mb-2">By WhatsApp</h3>
              <p>
                Message us on WhatsApp at{' '}
                <strong>+44 7365 192524</strong>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Monday to Friday, 8am&ndash;8pm<br />
                Saturday, 9am&ndash;5pm
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 hover:border-primary transition-colors">
              <h3 className="text-sm font-semibold text-foreground mb-2">By email</h3>
              <p>
                <Link
                  href="mailto:complaints@nexusbank.co.uk"
                  className="text-primary hover:underline underline-offset-4"
                >
                  complaints@nexusbank.co.uk
                </Link>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Please include your full name, account number (if applicable), and a
                description of your complaint.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 hover:border-primary transition-colors">
              <h3 className="text-sm font-semibold text-foreground mb-2">By post</h3>
              <p>
                Customer Relations<br />
                NexusBank Ltd<br />
                1 Nexus Square<br />
                London, EC2A 1BB
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 hover:border-primary transition-colors">
              <h3 className="text-sm font-semibold text-foreground mb-2">In branch</h3>
              <p>
                Visit any NexusBank branch and speak to a member of staff. They will record
                your complaint and ensure it is passed to our Customer Relations team.
              </p>
            </div>
          </div>

          <p className="mt-4">
            When making a complaint, it is helpful to provide as much detail as possible,
            including any relevant dates, transaction references, and the names of any
            staff members you have spoken to. This will help us investigate your complaint
            more efficiently.
          </p>
        </section>

        {/* 2 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            2. What We Will Do
          </h2>
          <p>
            Once we receive your complaint, we will follow a structured process to
            investigate and resolve your concerns:
          </p>
          <ol className="mt-3 list-decimal pl-6 space-y-2">
            <li>
              <strong>Acknowledge your complaint:</strong> we will acknowledge receipt of
              your complaint promptly. If you complain by phone, we will confirm the
              details of your complaint during the call. If you complain in writing, we
              will send a written acknowledgement within five business days.
            </li>
            <li>
              <strong>Investigate thoroughly:</strong> your complaint will be assigned to a
              dedicated complaints handler within our Customer Relations team. They will
              review all relevant information, including account records, call recordings,
              and correspondence. They may contact you to discuss the complaint further or
              to request additional information.
            </li>
            <li>
              <strong>Keep you informed:</strong> if we are unable to resolve your complaint
              within three business days, we will send you a written acknowledgement
              confirming the name of the person handling your complaint and the next steps
              in our process. We will provide regular updates on the progress of our
              investigation.
            </li>
            <li>
              <strong>Provide a resolution:</strong> we will offer a fair and reasonable
              resolution based on the outcome of our investigation. This may include an
              apology, a correction to your account, a refund of charges, or financial
              compensation where appropriate.
            </li>
            <li>
              <strong>Issue a final response:</strong> once our investigation is complete,
              we will send you a final response letter. This letter will explain the
              outcome of our investigation, the reasons for our decision, and any remedial
              action we have taken or propose to take.
            </li>
          </ol>
        </section>

        {/* 3 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            3. Timescales
          </h2>
          <p>
            We aim to resolve complaints as quickly as possible. The following timescales
            apply in accordance with the FCA&apos;s Dispute Resolution rules:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-1.5">
            <li>
              <strong>Within three business days:</strong> we will attempt to resolve
              straightforward complaints by the end of the third business day after the
              day we received your complaint. If we resolve your complaint within this
              timeframe, we will send you a written summary resolution communication
              confirming the resolution and informing you of your right to refer to the
              Financial Ombudsman Service if you are dissatisfied.
            </li>
            <li>
              <strong>Within eight weeks:</strong> for more complex complaints, we will
              aim to issue a final response within eight weeks of the date we received your
              complaint. If we are unable to provide a final response within eight weeks,
              we will write to you explaining the reasons for the delay and advise you of
              your right to refer your complaint to the Financial Ombudsman Service.
            </li>
          </ul>

          <div className="mt-4 rounded-lg border border-border bg-accent/30 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Payment-related complaints
            </h3>
            <p>
              For complaints about payment services (such as unauthorised transactions,
              incorrect payments, or payment delays), we will resolve your complaint within
              15 business days of receipt. In exceptional circumstances, this may be
              extended to 35 business days, and we will notify you of the extension and the
              reasons for it, in line with the Payment Services Regulations 2017.
            </p>
          </div>
        </section>

        {/* 4 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            4. The Financial Ombudsman Service
          </h2>
          <p>
            If you are not satisfied with our final response, or if we have not resolved
            your complaint within eight weeks, you have the right to refer your complaint
            to the Financial Ombudsman Service (FOS). The Financial Ombudsman Service is a
            free, independent service established by Parliament to resolve disputes between
            consumers and financial services firms.
          </p>
          <p className="mt-3">
            You must refer your complaint to the Financial Ombudsman Service within six
            months of the date of our final response. The Financial Ombudsman Service will
            only consider complaints that we have had the opportunity to resolve first.
          </p>

          <div className="mt-4 rounded-lg border border-border bg-card p-6 hover:border-primary transition-colors">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Financial Ombudsman Service contact details
            </h3>
            <ul className="space-y-1.5">
              <li>
                <strong>Post:</strong> Financial Ombudsman Service, Exchange Tower,
                London, E14 9SR
              </li>
              <li>
                <strong>Telephone:</strong> 0800 023 4567 (free from landlines) or
                0300 123 9123 (from mobiles)
              </li>
              <li>
                <strong>Email:</strong>{' '}
                <Link
                  href="mailto:complaint.info@financial-ombudsman.org.uk"
                  className="text-primary hover:underline underline-offset-4"
                >
                  complaint.info@financial-ombudsman.org.uk
                </Link>
              </li>
              <li>
                <strong>Website:</strong>{' '}
                <Link
                  href="https://www.financial-ombudsman.org.uk"
                  className="text-primary hover:underline underline-offset-4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  www.financial-ombudsman.org.uk
                </Link>
              </li>
            </ul>
          </div>

          <p className="mt-4">
            Referring your complaint to the Financial Ombudsman Service does not affect
            your legal right to take court action, although the Ombudsman will not
            adjudicate on a complaint that is the subject of court proceedings.
          </p>
        </section>

        {/* 5 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            5. Financial Services Compensation Scheme
          </h2>
          <p>
            NexusBank Ltd is covered by the Financial Services Compensation Scheme (FSCS).
            The FSCS can pay compensation if a firm is unable to meet its financial
            obligations. For deposits, the FSCS covers up to £85,000 per eligible
            depositor, per authorised firm. For joint accounts, the limit is £170,000.
          </p>
          <p className="mt-3">
            For further information about the FSCS, visit{' '}
            <Link
              href="https://www.fscs.org.uk"
              className="text-primary hover:underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.fscs.org.uk
            </Link>{' '}
            or call 0800 678 1100.
          </p>
        </section>

        {/* 6 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            6. Vulnerable Customers
          </h2>
          <p>
            We are committed to treating all customers fairly, and we recognise that some
            customers may be in vulnerable circumstances. If you have any additional needs,
            please let us know when you make your complaint and we will make reasonable
            adjustments to our process. This may include:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-1.5">
            <li>
              allowing a trusted third party, such as a family member or carer, to act on
              your behalf (with appropriate authorisation);
            </li>
            <li>
              providing communications in alternative formats, such as large print, Braille,
              or audio;
            </li>
            <li>
              allowing additional time for you to respond to correspondence;
            </li>
            <li>
              offering telephone appointments at a time convenient to you;
            </li>
            <li>
              providing a dedicated point of contact throughout the complaints process.
            </li>
          </ul>
        </section>

        {/* 7 */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            7. Our Commitment to Improvement
          </h2>
          <p>
            We use feedback from complaints to improve our products and services. All
            complaints are recorded and analysed to identify recurring issues, root causes,
            and opportunities for improvement. Our Board receives regular reports on
            complaint volumes, themes, and outcomes, ensuring that customer feedback
            informs our strategic decision-making.
          </p>
          <p className="mt-3">
            We publish complaint data twice a year in accordance with FCA requirements,
            including the number of complaints received, the proportion resolved within
            agreed timescales, and the proportion upheld. This data is available on the
            FCA&apos;s website.
          </p>
        </section>

        {/* ── Summary contact box ──────────────────────────────────────── */}
        <section className="rounded-lg border border-border bg-card p-6 hover:border-primary transition-colors">
          <h3 className="text-base font-semibold text-foreground mb-2">
            Need to make a complaint?
          </h3>
          <p className="mb-3">
            We are here to help. Contact our Customer Relations team using any of the
            methods below:
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="https://wa.me/447365192524"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white shadow-[0_2px_6px_rgba(0,0,0,0.1)] hover:brightness-105 transition-all"
            >
              WhatsApp +44 7365 192524
            </Link>
            <Link
              href="mailto:complaints@nexusbank.co.uk"
              className="inline-flex items-center rounded-full border-2 border-primary px-5 py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all"
            >
              Email complaints
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            NexusBank Ltd, 1 Nexus Square, London, EC2A 1BB. Authorised by the PRA and
            regulated by the FCA and PRA (FS Register no. 000000).
          </p>
        </section>
      </div>
    </article>
  )
}
