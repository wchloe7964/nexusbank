import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ContentIcon } from "@/components/shared/content-icon";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Savings Accounts | NexusBank",
  description:
    "Grow your money with NexusBank savings accounts. ISAs, easy access, fixed rate bonds and more.",
};

/* ── data ──────────────────────────────────────────────────────────── */

const highlights = [
  {
    icon: "/images/icons/chart-bar.svg",
    title: "Up to 5.10% AER",
    desc: "Competitive rates across all accounts",
  },
  {
    icon: "/images/icons/shield-check.svg",
    title: "FSCS Protected",
    desc: "Up to £85,000 per person",
  },
  {
    icon: "/images/icons/currency-pound.svg",
    title: "Tax-free ISAs",
    desc: "£20,000 annual allowance",
  },
  {
    icon: "/images/icons/banknotes.svg",
    title: "No minimums",
    desc: "Start saving from just £1",
  },
];

const products = [
  {
    name: "Easy Access Savings",
    illustration: "/images/illustrations/instant-access.svg",
    tag: "Popular",
    rate: "4.50% AER",
    description:
      "Flexible savings with instant access to your money whenever you need it.",
    features: [
      "Withdraw anytime with no penalties",
      "No minimum deposit",
      "Interest paid monthly",
      "Manage in the NexusBank app",
    ],
    href: "/register?type=savings",
  },
  {
    name: "Cash ISA",
    illustration: "/images/illustrations/cash-isa.svg",
    tag: "Tax free",
    rate: "4.75% AER",
    description:
      "Save up to £20,000 per tax year and earn interest completely tax-free.",
    features: [
      "Tax-free interest up to £20,000 allowance",
      "Flexible ISA — withdraw and replace",
      "Transfer existing ISAs in",
      "Easy access to your savings",
    ],
    href: "/register?type=savings",
  },
  {
    name: "Fixed Rate Bond",
    illustration: "/images/illustrations/bonds.svg",
    tag: "Best rate",
    rate: "5.10% AER",
    description:
      "Lock away your savings for a fixed term and earn a guaranteed rate of interest.",
    features: [
      "Guaranteed fixed rate for the term",
      "1, 2, or 3 year terms available",
      "From £1,000 minimum deposit",
      "Interest paid at maturity or annually",
    ],
    href: "/register?type=savings",
  },
  {
    name: "Notice Account",
    illustration: null,
    tag: null,
    rate: "4.85% AER",
    description:
      "Higher rates than easy access with the flexibility of a notice period.",
    features: [
      "90-day notice period",
      "Higher rates than instant access",
      "No maximum deposit limit",
      "Interest paid monthly",
    ],
    href: "/register?type=savings",
  },
  {
    name: "Junior Cash ISA",
    illustration: null,
    tag: "Children",
    rate: "4.60% AER",
    description:
      "Start saving for your child\u2019s future with a tax-free Junior ISA.",
    features: [
      "Tax-free savings for under 18s",
      "Up to £9,000 per year allowance",
      "Family and friends can contribute",
      "Child gains access at 18",
    ],
    href: "/register?type=savings",
  },
];

const tools = [
  {
    icon: "/images/icons/calculator.svg",
    title: "Savings calculator",
    desc: "See how your savings could grow over time with our interactive calculator.",
    href: "/tools/savings-calculator",
  },
  {
    icon: "/images/icons/arrow-path.svg",
    title: "ISA transfer",
    desc: "Transfer your existing ISAs to NexusBank without losing your tax-free allowance.",
    href: "/register?type=isa-transfer",
  },
  {
    icon: "/images/icons/document-text.svg",
    title: "Savings guide",
    desc: "Not sure where to start? Read our guide to saving and ISAs.",
    href: "/help",
  },
];

/* ── page ──────────────────────────────────────────────────────────── */

export default function SavingsPage() {
  return (
    <>
      {/* ── Dark gradient hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1a3e] via-[#102a5c] to-[#0e2350]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,174,239,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-14 lg:py-20 relative grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
              NexusBank Savings
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white max-w-2xl leading-tight">
              Make your money work harder
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/70 leading-relaxed">
              Whether you want easy access or the best fixed rates, we have a
              savings account to suit you. All deposits are FSCS protected up to
              £85,000.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register?type=savings"
                className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
              >
                Open a savings account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register?type=isa-transfer"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:bg-white/5 transition"
              >
                Transfer an ISA
              </Link>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <Image
              src="/images/hero/hero-savings.jpeg"
              alt="NexusBank Savings"
              width={600}
              height={400}
              className="rounded-2xl shadow-2xl object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── Highlight bar ───────────────────────────────────────────── */}
      <section className="border-b border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-10">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((h) => (
              <div key={h.title} className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07]">
                  <ContentIcon src={h.icon} size={22} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{h.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {h.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product cards ─────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Compare savings accounts
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Find the right account for your savings goals
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div
                key={p.name}
                className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                {p.illustration && (
                  <div className="flex justify-center mb-4">
                    <Image
                      src={p.illustration}
                      alt={p.name}
                      width={96}
                      height={96}
                      className="h-20 w-20 object-contain"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-bold">{p.name}</h3>
                  {p.tag && (
                    <span className="rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary">
                      {p.tag}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-primary mb-3">
                  {p.rate}
                </p>
                <p className="text-sm text-muted-foreground mb-5">
                  {p.description}
                </p>
                <ul className="space-y-2.5 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <ContentIcon
                        src="/images/icons/check-circle.svg"
                        size={16}
                        className="shrink-0 mt-0.5"
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:brightness-105 transition"
                >
                  Open account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tools section ───────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Savings tools &amp; resources
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Plan your savings journey with our free tools
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            {tools.map((t) => (
              <Link
                key={t.title}
                href={t.href}
                className="group rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mb-4">
                  <ContentIcon src={t.icon} size={22} />
                </div>
                <h3 className="text-sm font-bold group-hover:text-primary transition-colors">
                  {t.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Savings goals visual ──────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="relative rounded-2xl overflow-hidden">
              <Image
                src="/images/hero/hero-savings-goals.jpeg"
                alt="Set and track savings goals"
                width={640}
                height={420}
                className="w-full h-auto object-cover rounded-2xl"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-3">
                Set goals. Save smarter.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Use the NexusBank app to set savings goals, track your progress,
                and automate your saving. Whether you&apos;re saving for a holiday,
                a new car, or a rainy day — we&apos;ll help you get there.
              </p>
              <ul className="space-y-2.5 mb-6">
                {["Create personalised savings goals", "Automate deposits with round-ups", "Track progress with visual dashboards", "Get smart saving insights"].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <ContentIcon
                      src="/images/icons/check-circle.svg"
                      size={16}
                      className="shrink-0 mt-0.5"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register?type=savings"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:brightness-105 transition"
              >
                Start saving
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── ISA CTA ─────────────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mx-auto mb-4">
            <ContentIcon src="/images/icons/banknotes.svg" size={22} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Make the most of your ISA allowance
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
            Don&apos;t let your £20,000 annual ISA allowance go to waste. Open a
            Cash ISA today and start earning tax-free interest. You can also
            transfer ISAs from other providers.
          </p>
          <Link
            href="/register?type=savings"
            className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
          >
            Open a Cash ISA
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
