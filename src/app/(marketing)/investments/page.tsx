import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ContentIcon } from "@/components/shared/content-icon";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Investments | NexusBank",
  description:
    "Grow your wealth with NexusBank investment accounts. Stocks & Shares ISAs, SIPPs, and managed portfolios with expert guidance.",
};

/* ── data ──────────────────────────────────────────────────────────── */

const highlights = [
  {
    icon: "/images/icons/arrow-trending-up.svg",
    title: "Grow your wealth",
    desc: "Access global markets and managed funds",
  },
  {
    icon: "/images/icons/shield-check.svg",
    title: "FSCS protected",
    desc: "Investments protected up to \u00a385,000",
  },
  {
    icon: "/images/icons/sparkles.svg",
    title: "Expert managed",
    desc: "Leave it to our investment professionals",
  },
  {
    icon: "/images/icons/device-phone-mobile.svg",
    title: "Invest via the app",
    desc: "Buy, sell and track from your phone",
  },
];

const products = [
  {
    name: "Stocks & Shares ISA",
    tag: "Tax-free",
    headline: "Up to \u00a320,000/year",
    description:
      "Invest up to \u00a320,000 per tax year and any growth or income is completely tax-free. Choose from ready-made portfolios or pick your own funds.",
    features: [
      "Tax-free gains and dividends",
      "Invest up to \u00a320,000 per tax year",
      "Choose from 3 ready-made portfolios",
      "Or pick from 2,000+ funds and shares",
      "No platform fee for the first year",
      "Transfer existing ISAs in easily",
    ],
    href: "/register?type=invest-isa",
  },
  {
    name: "Personal Pension (SIPP)",
    tag: "Retirement",
    headline: "Tax relief on contributions",
    description:
      "Take control of your retirement savings with a self-invested personal pension. Benefit from tax relief and choose how your money is invested.",
    features: [
      "Government adds 25% basic-rate tax relief",
      "Higher-rate taxpayers can claim more",
      "Wide range of funds and shares",
      "Flexible drawdown from age 55",
      "Consolidate old pensions in one place",
      "Retirement planning tools included",
    ],
    href: "/register?type=invest-sipp",
  },
  {
    name: "Managed Portfolio",
    tag: "Hands-off",
    headline: "We invest for you",
    description:
      "Not sure where to start? Our investment team manages your portfolio based on your risk appetite and goals. Just choose a risk level and we do the rest.",
    features: [
      "5 risk-rated portfolio options",
      "Managed by our expert investment team",
      "Automatic rebalancing included",
      "Invest from just \u00a325 per month",
      "Quarterly performance reports",
      "Change your risk level anytime",
    ],
    href: "/register?type=invest-managed",
  },
  {
    name: "General Investment Account",
    tag: null,
    headline: "No annual limit",
    description:
      "Already used your ISA allowance? Invest without limits in a general investment account with access to our full range of funds and shares.",
    features: [
      "No limit on how much you invest",
      "Access to 2,000+ funds and shares",
      "Flexible withdrawals anytime",
      "Competitive dealing charges",
      "Regular investing from \u00a325/month",
      "Real-time portfolio tracking in-app",
    ],
    href: "/register?type=invest-gia",
  },
];

const riskLevels = [
  {
    level: "Cautious",
    icon: "/images/icons/shield-check.svg",
    desc: "Lower risk with a focus on capital preservation. Mostly bonds and cash equivalents.",
  },
  {
    level: "Balanced",
    icon: "/images/icons/arrow-path.svg",
    desc: "A mix of equities and bonds designed for steady, medium-term growth.",
  },
  {
    level: "Adventurous",
    icon: "/images/icons/arrow-trending-up.svg",
    desc: "Higher equity weighting for greater growth potential over the long term.",
  },
];

/* ── page ──────────────────────────────────────────────────────────── */

export default function InvestmentsPage() {
  return (
    <>
      {/* ── Dark gradient hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1a3e] via-[#102a5c] to-[#0e2350]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,174,239,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-14 lg:py-20 relative grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
              NexusBank Investments
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white max-w-2xl leading-tight">
              Invest today for a brighter tomorrow
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/70 leading-relaxed">
              Whether you want to manage your own portfolio or let our experts do it for you,
              we have investment options to suit every goal and risk appetite.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register?type=invest"
                className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
              >
                Start investing
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#products"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:bg-white/5 transition"
              >
                Explore options
              </Link>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <Image
              src="/images/hero/hero-investments.jpeg"
              alt="NexusBank Investments"
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
                  <p className="text-xs text-muted-foreground mt-0.5">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Investment products ─────────────────────────────────────── */}
      <section id="products" className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Investment accounts
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Choose the account that matches your goals
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
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[10px] text-muted-foreground/50">
            The value of investments can go down as well as up and you may get back less than you invest. Tax treatment depends on individual circumstances and may change. Past performance is not a guide to future performance.
          </p>
        </div>
      </section>

      {/* ── Risk levels ─────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Choose your risk level
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Our managed portfolios come in three risk-rated options
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            {riskLevels.map((r) => (
              <div
                key={r.level}
                className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mb-4">
                  <ContentIcon src={r.icon} size={22} />
                </div>
                <h3 className="text-sm font-bold">{r.level}</h3>
                <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Promo visual ─────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary mb-4">
                Limited time
              </span>
              <h2 className="text-2xl font-bold tracking-tight mb-3">
                Win up to &pound;50,000 with Smart Investor
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Open a new Stocks &amp; Shares ISA or General Investment Account
                and you could be entered into our prize draw. Capital at risk.
                Terms and conditions apply.
              </p>
              <Link
                href="/register?type=invest"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:brightness-105 transition"
              >
                Find out more
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative rounded-2xl overflow-hidden">
              <Image
                src="/images/sections/investment-promo.jpg"
                alt="Smart Investor prize draw"
                width={640}
                height={420}
                className="w-full h-auto object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mx-auto mb-4">
            <ContentIcon src="/images/icons/arrow-trending-up.svg" size={22} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Start investing from &pound;25
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
            Open an account in minutes and start building your portfolio. Set up regular
            investing or make lump-sum contributions &mdash; it&apos;s completely flexible.
          </p>
          <Link
            href="/register?type=invest"
            className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
          >
            Open an investment account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
