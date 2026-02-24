import type { Metadata } from "next";
import Link from "next/link";
import { ContentIcon } from "@/components/shared/content-icon";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Credit Cards | NexusBank",
  description:
    "Compare NexusBank credit cards. Rewards, balance transfers, purchases — find the card for you.",
};

/* ── data ──────────────────────────────────────────────────────────── */

const highlights = [
  {
    icon: "/images/icons/gift.svg",
    title: "Earn rewards",
    desc: "Up to 2 points per £1 spent",
  },
  {
    icon: "/images/icons/clock.svg",
    title: "0% offers",
    desc: "Up to 29 months interest-free",
  },
  {
    icon: "/images/icons/shield-check.svg",
    title: "Fraud protection",
    desc: "24/7 fraud monitoring",
  },
  {
    icon: "/images/icons/credit-card.svg",
    title: "Digital wallet",
    desc: "Apple Pay & Google Pay",
  },
];

const cards = [
  {
    name: "NexusBank Rewards Card",
    tag: "Most Popular",
    headline: "Earn 1 point per £1 spent",
    description:
      "Earn rewards on every purchase and redeem for cashback, travel, or gift cards.",
    features: [
      "1 NexusPoint per £1 spent",
      "No annual fee",
      "20.9% APR (representative)",
      "Contactless & Apple Pay / Google Pay",
      "Redeem points for cashback or rewards",
      "Up to 56 days interest-free on purchases",
    ],
    href: "/register",
  },
  {
    name: "Platinum Purchase Card",
    tag: "0% Purchases",
    headline: "0% for 24 months on purchases",
    description:
      "Spread the cost of large purchases interest-free for up to 24 months.",
    features: [
      "0% interest on purchases for 24 months",
      "No annual fee",
      "21.9% APR after promotional period",
      "Contactless & digital wallet",
      "Manage in the NexusBank app",
      "Minimum credit limit of £500",
    ],
    href: "/register",
  },
  {
    name: "Balance Transfer Card",
    tag: "0% Balance Transfer",
    headline: "0% for 29 months on transfers",
    description:
      "Transfer existing credit card balances and pay 0% interest for up to 29 months.",
    features: [
      "0% on balance transfers for 29 months",
      "2.99% balance transfer fee",
      "No annual fee",
      "21.9% APR after promotional period",
      "Apply online in minutes",
      "Transfer up to 95% of your credit limit",
    ],
    href: "/register",
  },
  {
    name: "Premier Platinum Card",
    tag: "Premium",
    headline: "2 points per £1 + travel perks",
    description:
      "Enhanced rewards and premium travel benefits for NexusBank Premier customers.",
    features: [
      "2 NexusPoints per £1 spent",
      "Airport lounge access worldwide",
      "Travel insurance included",
      "No foreign transaction fees",
      "Concierge service",
      "£150 annual fee (waived for Premier customers)",
    ],
    href: "/register",
  },
];

/* ── page ──────────────────────────────────────────────────────────── */

export default function CreditCardsPage() {
  return (
    <>
      {/* ── Dark gradient hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1a3e] via-[#102a5c] to-[#0e2350]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,174,239,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-14 lg:py-20 relative">
          <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
            NexusBank Credit Cards
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white max-w-2xl leading-tight">
            The credit card that rewards you
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 leading-relaxed">
            From rewards to balance transfers, find the credit card that works
            for you. Check your eligibility without affecting your credit score.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
            >
              Check your eligibility
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#compare"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:bg-white/5 transition"
            >
              Compare cards
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

      {/* ── Card products ─────────────────────────────────────────── */}
      <section id="compare" className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Compare credit cards
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Find the right card for your needs
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {cards.map((c) => (
              <div
                key={c.name}
                className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold">{c.name}</h3>
                    <p className="text-xl font-bold text-primary mt-1">
                      {c.headline}
                    </p>
                  </div>
                  {c.tag && (
                    <span className="rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary">
                      {c.tag}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  {c.description}
                </p>
                <ul className="space-y-2.5 mb-6">
                  {c.features.map((f) => (
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
                  href={c.href}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:brightness-105 transition"
                >
                  Check eligibility
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[10px] text-muted-foreground/50">
            Representative example: When you spend £1,200 at a purchase rate of
            20.9% p.a. (variable), your representative APR will be 20.9% APR
            (variable). Credit is available subject to status. NexusBank Ltd, 1
            Nexus Square, London, EC2A 1BB.
          </p>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="border-t border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mx-auto mb-4">
            <ContentIcon src="/images/icons/credit-card.svg" size={22} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Not sure which card is right for you?
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
            Check your eligibility in minutes without affecting your credit
            score. We&apos;ll show you which cards you&apos;re most likely to be
            approved for.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
          >
            Check your eligibility
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
