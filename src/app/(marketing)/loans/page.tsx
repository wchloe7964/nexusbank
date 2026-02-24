import type { Metadata } from "next";
import Link from "next/link";
import { ContentIcon } from "@/components/shared/content-icon";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Personal Loans | NexusBank",
  description:
    "Borrow from £1,000 to £50,000 with NexusBank personal loans. Fixed rates, no early repayment fees.",
};

/* ── data ──────────────────────────────────────────────────────────── */

const highlights = [
  {
    icon: "/images/icons/currency-pound.svg",
    title: "From 3.3% APR",
    desc: "Representative on loans £7,500+",
  },
  {
    icon: "/images/icons/calculator.svg",
    title: "No fees",
    desc: "No arrangement or early repayment fees",
  },
  {
    icon: "/images/icons/clock.svg",
    title: "Quick decisions",
    desc: "Get a decision in minutes",
  },
  {
    icon: "/images/icons/shield-check.svg",
    title: "Rate check",
    desc: "Check your rate without affecting your credit score",
  },
];

const loanProducts = [
  {
    name: "Personal Loan",
    tag: "From 3.3% APR",
    description:
      "A fixed-rate loan for whatever you need. Borrow between £1,000 and £50,000 with repayment terms from 1 to 7 years.",
    features: [
      "Borrow £1,000 to £50,000",
      "Fixed monthly repayments",
      "From 3.3% APR representative",
      "1 to 7 year repayment terms",
      "No arrangement fees",
      "No early repayment charges",
    ],
    href: "/register",
  },
  {
    name: "Car Finance",
    tag: "Vehicles",
    description:
      "Finance your next car with a dedicated car loan. Competitive rates for new and used vehicles.",
    features: [
      "Borrow £3,000 to £35,000",
      "New and used car finance",
      "Fixed monthly repayments",
      "From 3.9% APR representative",
      "Flexible terms: 1 to 5 years",
      "Get a quote in minutes",
    ],
    href: "/register",
  },
  {
    name: "Debt Consolidation",
    tag: "Simplify",
    description:
      "Combine multiple debts into one manageable monthly payment at a potentially lower rate.",
    features: [
      "One simple monthly payment",
      "May reduce your overall interest",
      "Fixed rate for the full term",
      "From £1,000 to £50,000",
      "No early repayment fees",
      "Clear end date for your debt",
    ],
    href: "/register",
  },
];

const tools = [
  {
    icon: "/images/icons/calculator.svg",
    title: "Loan calculator",
    desc: "Estimate your monthly repayments based on the loan amount, term and rate.",
    href: "/tools/loan-calculator",
  },
  {
    icon: "/images/icons/currency-pound.svg",
    title: "Check your rate",
    desc: "Get a personalised rate quote in minutes without affecting your credit score.",
    href: "/register",
  },
  {
    icon: "/images/icons/document-text.svg",
    title: "Borrowing guide",
    desc: "Understand the different types of borrowing and which is right for you.",
    href: "/help",
  },
];

/* ── page ──────────────────────────────────────────────────────────── */

export default function LoansPage() {
  return (
    <>
      {/* ── Dark gradient hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1a3e] via-[#102a5c] to-[#0e2350]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,174,239,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-14 lg:py-20 relative">
          <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
            NexusBank Personal Loans
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white max-w-2xl leading-tight">
            Borrow with confidence, repay with ease
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 leading-relaxed">
            Borrow from £1,000 to £50,000 with a NexusBank personal loan. Fixed
            monthly repayments, no arrangement fees, and no early repayment
            charges.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
            >
              Check your rate
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools/loan-calculator"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:bg-white/5 transition"
            >
              Loan calculator
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
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {h.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Loan products ─────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Our loan options
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Fixed rates, flexible terms, no hidden fees
          </p>

          <div className="grid gap-6 lg:grid-cols-3">
            {loanProducts.map((p) => (
              <div
                key={p.name}
                className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold">{p.name}</h3>
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
                  Check your rate
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[10px] text-muted-foreground/50">
            Representative example: Loan amount £10,000 over 48 months at 3.3%
            APR (representative). Monthly repayment £222.14. Total amount
            payable £10,662.72. Rate may vary depending on individual
            circumstances. Credit is available subject to status.
          </p>
        </div>
      </section>

      {/* ── Tools section ───────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Loan tools &amp; resources
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Plan your borrowing with our free online tools
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
            <ContentIcon src="/images/icons/currency-pound.svg" size={22} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Ready to get a personalised rate?
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
            Check your rate in minutes without affecting your credit score.
            There&apos;s no obligation to proceed and you&apos;ll get an instant
            decision.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
          >
            Get your personalised rate
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
