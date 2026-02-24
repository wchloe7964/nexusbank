import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentIcon } from '@/components/shared/content-icon'

export const metadata: Metadata = {
  title: 'Disability, Wellbeing and Challenging Times | NexusBank',
  description:
    'Supporting your needs, whatever your situation. NexusBank has a range of ways to help make banking easier.',
}

/* ────────────────────────────────────────────────────────────────────── */
/* Reusable card component                                              */
/* ────────────────────────────────────────────────────────────────────── */
function SupportCard({
  iconSrc,
  title,
  description,
  href,
}: {
  iconSrc: string
  title: string
  description: string
  href?: string
}) {
  const content = (
    <div className="group flex gap-4 rounded-xl border border-border bg-white dark:bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.07]">
        <ContentIcon src={iconSrc} size={20} />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}

/* ────────────────────────────────────────────────────────────────────── */
/* Contact card component                                               */
/* ────────────────────────────────────────────────────────────────────── */
function ContactCard({
  iconSrc,
  title,
  description,
}: {
  iconSrc: string
  title: string
  description: string
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-white dark:bg-card p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.07]">
        <ContentIcon src={iconSrc} size={20} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── */
/* Main Page                                                            */
/* ────────────────────────────────────────────────────────────────────── */
export default function AccessibilityPage() {
  return (
    <article>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <header className="mb-10">
        <div className="accent-bar mb-4" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Disability, wellbeing and challenging times
        </h1>
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">
          Supporting your needs, whatever your situation
        </p>
        <p className="mt-4 text-sm leading-relaxed text-foreground/80">
          If you have a disability, a physical or mental health condition, or just need extra
          support because your circumstances have changed, we have a range of ways to help make
          banking easier.
        </p>
      </header>

      <div className="space-y-12 text-sm leading-relaxed text-foreground/80">

        {/* ── We're here to help ──────────────────────────────────────── */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            We&apos;re here to help
          </h2>
          <p className="mb-3">
            Do you need help with your banking? We have lots of products and services, along with
            other useful resources, to support you.
          </p>
          <p className="mb-3">
            Perhaps you need us to change how we communicate with you. For example, you may request:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 mb-4">
            <li>Items to help you, such as braille documents and hearing loops</li>
            <li>That we&apos;re extra patient when we speak to you over the phone or in a branch</li>
            <li>That we take into consideration that your mood may vary, and your reactions might be affected</li>
          </ul>
          <p>
            Let us know your individual needs so we can discuss with you how we can make your
            banking easier. You can find our contact options further down this page.
          </p>
        </section>

        {/* ── Services, guides and resources ───────────────────────────── */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Services, guides and resources
          </h2>
          <p className="mb-6">
            We have a lot of online content dealing with accessibility, disabilities and other life
            events that you might be going through.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <SupportCard
              iconSrc="/images/icons/eye.svg"
              title="Blind or visual impairment"
              description="Practical ways to make banking easier if you're blind, have sight impairment or difficulty reading."
            />
            <SupportCard
              iconSrc="/images/icons/ear.svg"
              title="Deaf, hearing loss or speech impairment"
              description="If you're deaf, hard of hearing or have a speech impairment, we can help make banking easier."
            />
            <SupportCard
              iconSrc="/images/icons/hand-raised.svg"
              title="Mobility or dexterity impairment"
              description="Tools you may find useful to access our branches and services."
            />
            <SupportCard
              iconSrc="/images/icons/brain.svg"
              title="Neurodiversity"
              description="We understand that neurodiversity is different for each person, so we offer a range of services to help give everyone a chance to bank comfortably."
            />
          </div>

          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Let us know about your individual needs and we can tailor our services to better
              support you. All our branches have a quiet hour between 9:30am and 10:30am on the
              days they&apos;re open and some have private meeting rooms and offer longer appointments.
            </p>
          </div>
        </section>

        {/* ── Manage your debit card ──────────────────────────────────── */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-4">
            More ways we can help
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <SupportCard
              iconSrc="/images/icons/credit-card.svg"
              title="Manage your debit card"
              description="Find out how to view your card details and PIN number, set payment limits on your card and block payments to some types of retailers."
              href="/cards"
            />
            <SupportCard
              iconSrc="/images/icons/arrow-trending-up.svg"
              title="The cost of living"
              description="How to look after your money when prices rise."
            />
            <SupportCard
              iconSrc="/images/icons/exclamation-triangle.svg"
              title="Managing money problems"
              description="Practical guidance if you're worried about your finances."
            />
            <SupportCard
              iconSrc="/images/icons/academic-cap.svg"
              title="NexusBank Money Mentors"
              description="Get impartial guidance on a range of topics, from better budgeting tips to buying a home."
            />
            <SupportCard
              iconSrc="/images/icons/heartbeat.svg"
              title="Living with illness or disability"
              description="How to get the right support with your money and your wellbeing."
            />
            <SupportCard
              iconSrc="/images/icons/heart.svg"
              title="Coping with illness"
              description="Read our case study on balancing illness and debt."
            />
            <SupportCard
              iconSrc="/images/icons/user-group.svg"
              title="Third-party access to bank accounts"
              description="We explain the different types of third-party access available if you or someone else needs help managing money."
            />
            <SupportCard
              iconSrc="/images/icons/device-phone-mobile.svg"
              title="Learn about the NexusBank app"
              description="Find out how our app can help you access our services, manage your accounts and stay in control of your money."
            />
            <SupportCard
              iconSrc="/images/icons/brain.svg"
              title="Mental health and your money"
              description="Recognising the signs of problems with mental health and how to keep on top of your finances."
            />
            <SupportCard
              iconSrc="/images/icons/currency-pound.svg"
              title="Debt and mental health"
              description="Mental health and money management are often linked. Read our case study about steps you can take to help get back on track."
            />
            <SupportCard
              iconSrc="/images/icons/shield-exclamation.svg"
              title="Protect yourself from scams"
              description="Learn about different types of scam and the latest tactics scammers are using, so you know what to look out for."
            />
            <SupportCard
              iconSrc="/images/icons/exclamation-triangle.svg"
              title="Help with financial abuse"
              description="See how to spot the signs of abuse that could affect your money, and how we can help."
            />
            <SupportCard
              iconSrc="/images/icons/briefcase.svg"
              title="If you've lost your job"
              description="See how you can plan your next steps if you find yourself out of regular work."
            />
            <SupportCard
              iconSrc="/images/icons/dice.svg"
              title="Gambling problems"
              description="What to do if gambling starts to become a problem."
            />
            <SupportCard
              iconSrc="/images/icons/shopping-cart.svg"
              title="Compulsive spending problems"
              description="If you're worried about how much you spend, here are nine ways to help you cut down."
            />
            <SupportCard
              iconSrc="/images/icons/document-text.svg"
              title="What to do when someone dies"
              description="How we can help and support you if you're dealing with the financial affairs of someone close to you."
            />
          </div>
        </section>

        {/* ── How to contact us ───────────────────────────────────────── */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-3">
            How to contact us
          </h2>
          <p className="mb-2">
            If you&apos;d like to talk to us about any of our accessibility and disability
            services, or you&apos;d like us to know about your needs, there are several ways to
            reach us.
          </p>
          <p className="mb-2">
            In some cases, we might need to contact you to discuss those needs in more detail.
          </p>
          <p className="mb-6">
            You can also tell us if your situation changes and something is no longer an issue.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <ContactCard
              iconSrc="/images/icons/device-phone-mobile.svg"
              title="In our app"
              description="You can tell us about your needs and circumstances in the NexusBank app on your smartphone or tablet by tapping 'Help'."
            />
            <ContactCard
              iconSrc="/images/icons/globe-alt.svg"
              title="Online"
              description="You can tell us about your needs and circumstances in Online Banking — just go to 'Help'."
            />
            <ContactCard
              iconSrc="/images/icons/phone.svg"
              title="Over the phone"
              description="If you want to talk to us, we have several phone numbers you can call — for general information or specific queries."
            />
            <ContactCard
              iconSrc="/images/icons/map-pin.svg"
              title="In person"
              description="If you prefer a face-to-face service, come and see us. Search for branches with specialist services."
            />
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground">
            <sup>1</sup> You need to be 16 or over to use this service in the app. Terms and
            conditions apply.
          </p>
        </section>

        {/* ── Accessibility information ────────────────────────────────── */}
        <section>
          <div className="accent-bar mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Accessibility information
          </h2>

          <div className="space-y-4">
            <div className="flex gap-4 rounded-xl border border-border bg-white dark:bg-card p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.07]">
                <ContentIcon src="/images/icons/cog.svg" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Changing your settings</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  If you want to make your computer or device easier to use, we&apos;ve created
                  resources with disability charity AbilityNet to show you how to do so.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-xl border border-border bg-white dark:bg-card p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.07]">
                <ContentIcon src="/images/icons/chat-bubble.svg" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Read our accessibility statement</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Our aim is, and has always been, to provide accessible services for everyone. Our
                  accessibility statement outlines our approach and ambitions.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-xl border border-border bg-white dark:bg-card p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.07]">
                <ContentIcon src="/images/icons/book-open.svg" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Reference guides</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Read more about our accessible services and other ways to bank in our
                  &lsquo;Making banking easier&rsquo; brochure. Our &lsquo;Banking Made
                  Clearer&rsquo; quick reference guide was written in partnership with the British
                  Institute of Learning Disabilities, using simple, clear language with lots of
                  imagery.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Regulatory footer ───────────────────────────────────────── */}
        <section className="border-t border-border/40 pt-6">
          <div className="space-y-2 text-[10px] leading-relaxed text-muted-foreground/50">
            <p>
              NexusBank UK PLC and NexusBank PLC are each authorised by the Prudential Regulation
              Authority and regulated by the Financial Conduct Authority and the Prudential
              Regulation Authority.
            </p>
            <p>
              NexusBank Investment Solutions Limited is authorised and regulated by the Financial
              Conduct Authority.
            </p>
            <p>
              Registered office for all: 1 Churchill Place, London E14 5HP.
            </p>
          </div>
        </section>
      </div>
    </article>
  )
}
