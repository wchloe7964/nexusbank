import type { Metadata } from "next";
import Link from "next/link";
import { ContentIcon } from "@/components/shared/content-icon";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Mortgages | NexusBank",
  description:
    "Find the right mortgage with NexusBank. First-time buyer, remortgage, buy-to-let and moving home options with competitive rates.",
};

/* ── data ──────────────────────────────────────────────────────────── */

const highlights = [
  {
    icon: "/images/icons/home.svg",
    title: "Competitive rates",
    desc: "Fixed, tracker and variable options",
  },
  {
    icon: "/images/icons/calculator.svg",
    title: "Borrow up to 5.5\u00d7 salary",
    desc: "Subject to affordability checks",
  },
  {
    icon: "/images/icons/clock.svg",
    title: "Decision in principle",
    desc: "Get an answer in minutes online",
  },
  {
    icon: "/images/icons/phone.svg",
    title: "Expert advisers",
    desc: "Free mortgage guidance, no obligation",
  },
];

const products = [
  {
    name: "First-Time Buyer",
    tag: "Popular",
    rate: "From 4.12% fixed",
    description:
      "Step onto the property ladder with rates designed for first-time buyers. Borrow up to 95% LTV with no product fee options available.",
    features: [
      "Borrow up to 95% of the property value",
      "2 and 5 year fixed rate options",
      "No product fee alternatives available",
      "Free standard property valuation",
      "Dedicated first-time buyer support team",
      "\u00a3500 cashback on completion",
    ],
    href: "/register?type=mortgage-ftb",
  },
  {
    name: "Remortgage",
    tag: "Switch & save",
    rate: "From 3.89% fixed",
    description:
      "Switch your mortgage to NexusBank and you could save on your monthly payments. Free legal fees and no valuation charges.",
    features: [
      "Free legal fees for remortgages",
      "Free standard property valuation",
      "2, 3 and 5 year fixed rate terms",
      "Rates from 3.89% for 60% LTV",
      "Overpayment allowance up to 10% per year",
      "No early repayment charges after fixed period",
    ],
    href: "/register?type=remortgage",
  },
  {
    name: "Moving Home",
    tag: null,
    rate: "From 4.05% fixed",
    description:
      "Moving to a new property? Port your existing mortgage or take out a new deal with NexusBank at competitive rates.",
    features: [
      "Port your existing mortgage rate",
      "Borrow additional funds if needed",
      "2 and 5 year fixed rate options",
      "Free standard property valuation",
      "Flexible overpayment options",
      "Dedicated case manager throughout",
    ],
    href: "/register?type=mortgage-mover",
  },
  {
    name: "Buy to Let",
    tag: "Landlords",
    rate: "From 4.49% fixed",
    description:
      "Finance your investment property with a NexusBank buy-to-let mortgage. Competitive rates for individual and limited company landlords.",
    features: [
      "Individual and limited company applications",
      "Borrow up to 75% LTV",
      "Interest-only and repayment options",
      "2 and 5 year fixed rate terms",
      "Portfolio landlord solutions available",
      "No minimum income requirement",
    ],
    href: "/register?type=mortgage-btl",
  },
];

const tools = [
  {
    icon: "/images/icons/calculator.svg",
    title: "Mortgage calculator",
    desc: "Estimate your monthly repayments based on the amount, term and interest rate.",
    href: "/tools/mortgage-calculator",
  },
  {
    icon: "/images/icons/currency-pound.svg",
    title: "How much can I borrow?",
    desc: "Find out how much you could borrow based on your income and outgoings.",
    href: "/tools/borrowing-calculator",
  },
  {
    icon: "/images/icons/document-text.svg",
    title: "Agreement in principle",
    desc: "Get a decision in principle in minutes without affecting your credit score.",
    href: "/register?type=mortgage-aip",
  },
];

/* ── page ──────────────────────────────────────────────────────────── */

export default function MortgagesPage() {
  return (
    <>
      {/* ── Dark gradient hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1a3e] via-[#102a5c] to-[#0e2350]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,174,239,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-14 lg:py-20 relative">
          <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
            NexusBank Mortgages
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white max-w-2xl leading-tight">
            Find the right mortgage for your next chapter
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 leading-relaxed">
            Whether you&apos;re buying your first home, remortgaging, or investing in property,
            our competitive rates and expert guidance make the process straightforward.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register?type=mortgage"
              className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
            >
              Get a decision in principle
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools/mortgage-calculator"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:bg-white/5 transition"
            >
              Mortgage calculator
            </Link>
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
                  <p className="text-xs text-muted-foreground mt-0.5">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mortgage products ───────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Our mortgage options
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Competitive rates across fixed, tracker and variable products
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {products.map((p) => (
              <div
                key={p.name}
                className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold">{p.name}</h3>
                    <p className="text-xl font-bold text-primary mt-1">
                      {p.rate}
                    </p>
                  </div>
                  {p.tag && (
                    <span className="rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary">
                      {p.tag}
                    </span>
                  )}
                </div>
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
                  Apply now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[10px] text-muted-foreground/50">
            Representative example: a mortgage of &pound;200,000 payable over 25 years on a fixed rate of 4.12% would require 300 monthly payments of &pound;1,067.84. The total amount payable would be &pound;320,352. Overall cost for comparison 4.5% APRC.
          </p>
        </div>
      </section>

      {/* ── Tools section ───────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Mortgage tools &amp; calculators
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Plan your next move with our free online tools
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

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mx-auto mb-4">
            <ContentIcon src="/images/icons/home.svg" size={22} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Ready to get started?
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
            Get a decision in principle in minutes. It won&apos;t affect your credit score and there&apos;s no obligation to proceed.
          </p>
          <Link
            href="/register?type=mortgage"
            className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
          >
            Get your decision in principle
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
