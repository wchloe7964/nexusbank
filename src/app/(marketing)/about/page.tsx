import type { Metadata } from "next";
import Link from "next/link";
import { ContentIcon } from "@/components/shared/content-icon";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About NexusBank | NexusBank",
  description:
    "Learn about NexusBank. Our mission, values, history and commitment to helping customers achieve their financial goals.",
};

/* ── data ──────────────────────────────────────────────────────────── */

const highlights = [
  {
    icon: "/images/icons/user-group.svg",
    title: "12 million customers",
    desc: "Trusted by people across the UK",
  },
  {
    icon: "/images/icons/map-pin.svg",
    title: "800+ branches",
    desc: "A nationwide presence on your high street",
  },
  {
    icon: "/images/icons/briefcase.svg",
    title: "30,000 employees",
    desc: "Dedicated people serving you every day",
  },
  {
    icon: "/images/icons/clock.svg",
    title: "Established 1896",
    desc: "Over 125 years of banking heritage",
  },
];

const values = [
  {
    name: "Customers First",
    tag: "Core value",
    description:
      "Everything we do starts with our customers. We listen, we learn, and we build products and services that genuinely help people manage their money better.",
    features: [
      "Customer satisfaction score of 87%",
      "Award-winning mobile banking app",
      "24/7 UK-based customer support",
      "Regular customer feedback panels",
      "Transparent fees with no hidden charges",
      "Plain English in all communications",
    ],
  },
  {
    name: "Financial Inclusion",
    tag: "Community",
    description:
      "We believe everyone deserves access to fair and affordable financial services. Our basic accounts, financial education, and community programmes reflect this commitment.",
    features: [
      "Basic accounts with no credit check",
      "Free financial education workshops",
      "Community branch programme",
      "Vulnerable customer support team",
      "Partnerships with debt charities",
      "Accessible banking for all abilities",
    ],
  },
  {
    name: "Sustainability",
    tag: "ESG",
    description:
      "We are committed to reaching net zero by 2050 and are actively reducing our environmental impact across operations, lending, and investments.",
    features: [
      "Net zero target by 2050",
      "100% renewable energy in offices",
      "Green mortgage products",
      "Sustainable investment funds",
      "Paperless banking as default",
      "Annual sustainability report published",
    ],
  },
  {
    name: "Innovation",
    tag: null,
    description:
      "We invest in technology to make banking simpler, faster, and more secure. From open banking to AI-powered insights, we are building the future of finance.",
    features: [
      "Open Banking API integrations",
      "AI-powered spending insights",
      "Biometric authentication",
      "Real-time fraud detection",
      "Cloud-native banking platform",
      "Dedicated fintech partnerships team",
    ],
  },
];

const milestones = [
  {
    icon: "/images/icons/clock.svg",
    title: "1896 \u2014 Founded",
    desc: "NexusBank was established in London, offering savings and current accounts to local businesses.",
  },
  {
    icon: "/images/icons/globe-alt.svg",
    title: "1965 \u2014 National expansion",
    desc: "Expanded to over 200 branches across England, Scotland and Wales.",
  },
  {
    icon: "/images/icons/device-phone-mobile.svg",
    title: "2015 \u2014 Digital transformation",
    desc: "Launched our mobile banking app, now used by over 8 million customers.",
  },
];

/* ── page ──────────────────────────────────────────────────────────── */

export default function AboutPage() {
  return (
    <>
      {/* ── Dark gradient hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1a3e] via-[#102a5c] to-[#0e2350]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,174,239,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-14 lg:py-20 relative">
          <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
            About NexusBank
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white max-w-2xl leading-tight">
            Banking built around you since 1896
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 leading-relaxed">
            For over 125 years, we&apos;ve helped millions of people manage their money,
            buy their homes, and plan for the future. Our mission is simple: to be the
            UK&apos;s most helpful bank.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
            >
              Join our team
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:bg-white/5 transition"
            >
              Open an account
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

      {/* ── Values ──────────────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Our values
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            The principles that guide everything we do
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {values.map((v) => (
              <div
                key={v.name}
                className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold">{v.name}</h3>
                  {v.tag && (
                    <span className="rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary">
                      {v.tag}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  {v.description}
                </p>
                <ul className="space-y-2.5">
                  {v.features.map((f) => (
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

      {/* ── Milestones ──────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Our journey
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Key milestones in the NexusBank story
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            {milestones.map((m) => (
              <div
                key={m.title}
                className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mb-4">
                  <ContentIcon src={m.icon} size={22} />
                </div>
                <h3 className="text-sm font-bold">{m.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mx-auto mb-4">
            <ContentIcon src="/images/icons/heart.svg" size={22} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Want to be part of the story?
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
            We&apos;re always looking for talented people who share our values. Explore
            career opportunities at NexusBank and help us shape the future of banking.
          </p>
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
          >
            View open roles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
