import type { Metadata } from "next";
import Link from "next/link";
import { ContentIcon } from "@/components/shared/content-icon";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Insurance | NexusBank",
  description:
    "Protect what matters most with NexusBank insurance. Home, life, travel and gadget cover at competitive premiums.",
};

/* ── data ──────────────────────────────────────────────────────────── */

const highlights = [
  {
    icon: "/images/icons/shield-check.svg",
    title: "Comprehensive cover",
    desc: "Home, life, travel and gadget insurance",
  },
  {
    icon: "/images/icons/currency-pound.svg",
    title: "Competitive premiums",
    desc: "Great value cover from a bank you trust",
  },
  {
    icon: "/images/icons/device-phone-mobile.svg",
    title: "Manage in-app",
    desc: "View policies and make claims on the go",
  },
  {
    icon: "/images/icons/clock.svg",
    title: "Quick claims",
    desc: "Simple online claims process, fast payouts",
  },
];

const products = [
  {
    name: "Home Insurance",
    tag: "Popular",
    headline: "Buildings & contents",
    description:
      "Protect your home and belongings with flexible buildings, contents, or combined cover. Includes accidental damage and legal expenses as standard.",
    features: [
      "Buildings, contents, or combined cover",
      "Accidental damage included as standard",
      "New-for-old replacement on contents",
      "Home emergency cover available",
      "Legal expenses cover included",
      "No claims discount up to 5 years",
    ],
    href: "/register?type=insurance-home",
  },
  {
    name: "Life Insurance",
    tag: null,
    headline: "From \u00a35/month",
    description:
      "Give your family financial security with life cover that pays out a tax-free lump sum. Choose level or decreasing cover to match your mortgage.",
    features: [
      "Tax-free lump sum pay-out",
      "Level or decreasing term options",
      "Cover from \u00a350,000 to \u00a31,000,000",
      "Joint or single life policies",
      "Critical illness add-on available",
      "Fixed monthly premiums guaranteed",
    ],
    href: "/register?type=insurance-life",
  },
  {
    name: "Travel Insurance",
    tag: "Single & annual",
    headline: "Worldwide cover",
    description:
      "Single trip or annual multi-trip cover for individuals, couples and families. Includes medical expenses, cancellation and baggage cover.",
    features: [
      "Single trip and annual multi-trip options",
      "Up to \u00a310 million medical expenses",
      "Cancellation cover up to \u00a35,000",
      "Baggage and personal belongings cover",
      "24/7 emergency medical assistance",
      "Winter sports and cruise add-ons",
    ],
    href: "/register?type=insurance-travel",
  },
  {
    name: "Gadget & Phone Insurance",
    tag: "Tech",
    headline: "Protect your devices",
    description:
      "Cover your smartphone, tablet, laptop and other gadgets against accidental damage, theft and breakdown.",
    features: [
      "Accidental damage and liquid damage",
      "Theft and unauthorised call cover",
      "Mechanical breakdown after warranty",
      "Cover up to 3 devices on one policy",
      "Worldwide cover included",
      "Fast repair or replacement service",
    ],
    href: "/register?type=insurance-gadget",
  },
];

/* ── page ──────────────────────────────────────────────────────────── */

export default function InsurancePage() {
  return (
    <>
      {/* ── Dark gradient hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1a3e] via-[#102a5c] to-[#0e2350]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,174,239,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-14 lg:py-20 relative">
          <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
            NexusBank Insurance
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white max-w-2xl leading-tight">
            Protect what matters most to you
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 leading-relaxed">
            From your home to your holiday, our insurance products give you peace of mind
            with comprehensive cover and a simple claims process.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register?type=insurance"
              className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
            >
              Get a quote
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#products"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:bg-white/5 transition"
            >
              Compare cover
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

      {/* ── Insurance products ──────────────────────────────────────── */}
      <section id="products" className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Our insurance products
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Flexible cover tailored to your needs
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
                      {p.headline}
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
                  Get a quote
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[10px] text-muted-foreground/50">
            NexusBank Insurance is underwritten by NexusBank Insurance Services Ltd. Cover is subject to terms, conditions and exclusions. Full policy documents are provided before purchase.
          </p>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mx-auto mb-4">
            <ContentIcon src="/images/icons/shield-check.svg" size={22} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Not sure which cover you need?
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
            Speak to one of our insurance specialists who can help you find the right level
            of cover for your circumstances. No obligation, no jargon.
          </p>
          <Link
            href="/help"
            className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
          >
            Talk to a specialist
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
