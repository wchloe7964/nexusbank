import type { Metadata } from "next";
import Link from "next/link";
import { ContentIcon } from "@/components/shared/content-icon";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Premier Banking | NexusBank",
  description:
    "Experience NexusBank Premier Banking. Dedicated relationship manager, exclusive rewards, worldwide travel insurance and preferential rates.",
};

/* ── data ──────────────────────────────────────────────────────────── */

const highlights = [
  {
    icon: "/images/icons/crown.svg",
    title: "Dedicated manager",
    desc: "Your own relationship manager on hand",
  },
  {
    icon: "/images/icons/globe-alt.svg",
    title: "Travel benefits",
    desc: "Worldwide travel and phone insurance",
  },
  {
    icon: "/images/icons/sparkles.svg",
    title: "Exclusive rewards",
    desc: "Earn enhanced cashback and perks",
  },
  {
    icon: "/images/icons/currency-pound.svg",
    title: "Preferential rates",
    desc: "Better savings and mortgage rates",
  },
];

const benefits = [
  {
    name: "Premier Current Account",
    tag: "Core benefit",
    description:
      "An enhanced current account with a Visa Platinum debit card, higher contactless limits, and fee-free foreign currency transactions worldwide.",
    features: [
      "Visa Platinum debit card",
      "Fee-free foreign transactions",
      "Higher contactless payment limit",
      "Exclusive cheque book design",
      "Priority customer service line",
      "Enhanced daily ATM withdrawal limit",
    ],
  },
  {
    name: "Travel & Insurance",
    tag: "Included",
    description:
      "Comprehensive worldwide travel insurance for you and your family, plus mobile phone insurance covering loss, theft and damage.",
    features: [
      "Worldwide family travel insurance",
      "No age limit on travel cover",
      "Winter sports cover included",
      "Mobile phone insurance up to \u00a31,000",
      "Gadget cover add-on available",
      "Airport lounge access with LoungeKey",
    ],
  },
  {
    name: "Preferential Rates",
    tag: "Exclusive",
    description:
      "Access better rates across NexusBank savings accounts, mortgages and personal loans. Exclusive products only available to Premier customers.",
    features: [
      "Enhanced savings interest rates",
      "Reduced mortgage arrangement fees",
      "Lower personal loan APR",
      "Exclusive fixed-rate bonds",
      "Premier investment fund range",
      "Preferential foreign exchange rates",
    ],
  },
  {
    name: "Lifestyle Benefits",
    tag: "Rewards",
    description:
      "Enjoy a curated selection of lifestyle rewards including dining, entertainment, and retail discounts exclusively for Premier members.",
    features: [
      "Dining discounts at selected restaurants",
      "Priority access to event tickets",
      "Retail cashback offers",
      "Complimentary financial health check",
      "Invitations to exclusive NexusBank events",
      "Partner rewards programme",
    ],
  },
];

const eligibility = [
  {
    icon: "/images/icons/currency-pound.svg",
    title: "Annual income",
    desc: "Earn \u00a375,000+ per year (or \u00a3100,000+ in savings and investments with NexusBank)",
  },
  {
    icon: "/images/icons/home.svg",
    title: "Mortgage",
    desc: "Or hold a NexusBank mortgage with an outstanding balance of \u00a3300,000+",
  },
  {
    icon: "/images/icons/banknotes.svg",
    title: "Monthly fee",
    desc: "\u00a312 per month, waived when you meet the income or balance criteria",
  },
];

/* ── page ──────────────────────────────────────────────────────────── */

export default function PremierBankingPage() {
  return (
    <>
      {/* ── Dark gradient hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1a3e] via-[#102a5c] to-[#0e2350]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,174,239,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-14 lg:py-20 relative">
          <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
            NexusBank Premier
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white max-w-2xl leading-tight">
            Banking that goes beyond the everyday
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 leading-relaxed">
            Enjoy a dedicated relationship manager, exclusive rewards, worldwide travel insurance
            and preferential rates across all your NexusBank products.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register?type=premier"
              className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
            >
              Apply for Premier
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#benefits"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:bg-white/5 transition"
            >
              View all benefits
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

      {/* ── Benefits ────────────────────────────────────────────────── */}
      <section id="benefits" className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Premier benefits
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Everything that comes with your Premier membership
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {benefits.map((b) => (
              <div
                key={b.name}
                className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold">{b.name}</h3>
                  {b.tag && (
                    <span className="rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary">
                      {b.tag}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  {b.description}
                </p>
                <ul className="space-y-2.5">
                  {b.features.map((f) => (
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Eligibility ─────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Eligibility
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            You can qualify for Premier in one of the following ways
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            {eligibility.map((e) => (
              <div
                key={e.title}
                className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mb-4">
                  <ContentIcon src={e.icon} size={22} />
                </div>
                <h3 className="text-sm font-bold">{e.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mx-auto mb-4">
            <ContentIcon src="/images/icons/crown.svg" size={22} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Elevate your banking experience
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
            Apply for NexusBank Premier today and enjoy a banking experience designed
            around you. Your dedicated relationship manager will be in touch within 24 hours.
          </p>
          <Link
            href="/register?type=premier"
            className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
          >
            Apply for Premier Banking
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-[10px] text-muted-foreground/50">
            Premier Banking is subject to eligibility. &pound;12/month fee applies and may be waived if you meet the qualifying criteria.
          </p>
        </div>
      </section>
    </>
  );
}
