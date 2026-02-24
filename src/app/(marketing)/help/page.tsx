import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ContentIcon } from "@/components/shared/content-icon";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Help & Support | NexusBank",
  description:
    "Get help with your NexusBank account. Find answers, report fraud, contact us by phone, chat or in branch.",
};

/* ── data ──────────────────────────────────────────────────────────── */

const highlights = [
  {
    icon: "/images/icons/chat-bubble.svg",
    title: "Live chat",
    desc: "Chat with us in the app or online",
  },
  {
    icon: "/images/icons/phone.svg",
    title: "Call us 24/7",
    desc: "UK-based support around the clock",
  },
  {
    icon: "/images/icons/map-pin.svg",
    title: "Visit a branch",
    desc: "Book an appointment or walk in",
  },
  {
    icon: "/images/icons/document-text.svg",
    title: "Help articles",
    desc: "Find answers in our knowledge base",
  },
];

const topics = [
  {
    name: "Account & Payments",
    tag: "Popular",
    description:
      "Help with your current account, savings, payments, Direct Debits, standing orders and more.",
    items: [
      "How to make a payment or transfer",
      "Setting up or cancelling a Direct Debit",
      "Changing your address or personal details",
      "Viewing and downloading statements",
      "Understanding your account fees",
      "How to close an account",
    ],
    href: "/help",
  },
  {
    name: "Cards & Security",
    tag: "Urgent",
    description:
      "Report a lost or stolen card, freeze your card, manage your PIN, and learn how we keep you safe.",
    items: [
      "Report a lost or stolen card",
      "Freeze or unfreeze your card in the app",
      "Reset your card PIN",
      "Set up contactless and mobile payments",
      "How we protect you from fraud",
      "What to do if you spot suspicious activity",
    ],
    href: "/help",
  },
  {
    name: "Mortgages & Loans",
    tag: null,
    description:
      "Manage your mortgage or loan, make overpayments, request a redemption statement, or get payment support.",
    items: [
      "Make a mortgage overpayment",
      "Request a redemption statement",
      "Change your mortgage payment date",
      "Understand your loan repayment schedule",
      "Apply for a payment holiday",
      "Remortgage or switch your rate",
    ],
    href: "/help",
  },
  {
    name: "Online & App Banking",
    tag: null,
    description:
      "Troubleshoot login issues, set up the mobile app, manage notifications, and update your security settings.",
    items: [
      "Reset your online banking password",
      "Set up the NexusBank mobile app",
      "Enable biometric login (Face ID / fingerprint)",
      "Manage push notifications",
      "Update your registered email or phone",
      "Troubleshoot app errors",
    ],
    href: "/help",
  },
];

const urgentActions = [
  {
    icon: "/images/icons/exclamation-triangle.svg",
    title: "Report fraud",
    desc: "If you think your account has been compromised, let us know immediately.",
    href: "/help",
  },
  {
    icon: "/images/icons/credit-card.svg",
    title: "Lost or stolen card",
    desc: "Block your card instantly in the app or call our 24/7 helpline.",
    href: "/help",
  },
  {
    icon: "/images/icons/key.svg",
    title: "Locked out",
    desc: "Reset your password or unlock your account online in minutes.",
    href: "/help",
  },
];

/* ── page ──────────────────────────────────────────────────────────── */

export default function HelpPage() {
  return (
    <>
      {/* ── Dark gradient hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1a3e] via-[#102a5c] to-[#0e2350]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,174,239,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-14 lg:py-20 relative grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
              Help &amp; Support
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white max-w-2xl leading-tight">
              How can we help you today?
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/70 leading-relaxed">
              Find answers to common questions, report an issue, or get in touch with our
              UK-based support team. We&apos;re here for you 24 hours a day, 7 days a week.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/help"
                className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
              >
                Start a live chat
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/help"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:bg-white/5 transition"
              >
                Call us: 0800 123 4567
              </Link>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <Image
              src="/images/hero/hero-help.jpeg"
              alt="NexusBank Help and Support"
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

      {/* ── Help topics ─────────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Browse help topics
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Select a topic to find the answers you need
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {topics.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold">{t.name}</h3>
                  {t.tag && (
                    <span className="rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary">
                      {t.tag}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  {t.description}
                </p>
                <ul className="space-y-2.5 mb-6">
                  {t.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm">
                      <ContentIcon
                        src="/images/icons/check-circle.svg"
                        size={16}
                        className="shrink-0 mt-0.5"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={t.href}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:brightness-105 transition"
                >
                  View articles
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Urgent actions ──────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Need urgent help?
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Take immediate action on critical issues
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            {urgentActions.map((u) => (
              <Link
                key={u.title}
                href={u.href}
                className="group rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mb-4">
                  <ContentIcon src={u.icon} size={22} />
                </div>
                <h3 className="text-sm font-bold group-hover:text-primary transition-colors">
                  {u.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{u.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mx-auto mb-4">
            <ContentIcon src="/images/icons/chat-bubble.svg" size={22} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Can&apos;t find what you need?
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
            Our support team is available 24/7 by phone, live chat, or in branch.
            We&apos;re always happy to help.
          </p>
          <Link
            href="/help"
            className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
          >
            Contact us
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
