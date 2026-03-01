import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ContentIcon } from "@/components/shared/content-icon";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Ways to Bank | NexusBank",
  description:
    "Discover all the ways you can bank with NexusBank. Mobile app, online banking, telephone banking, branches and ATMs.",
};

/* ── data ──────────────────────────────────────────────────────────── */

const highlights = [
  {
    icon: "/images/icons/device-phone-mobile.svg",
    title: "Mobile app",
    desc: "Award-winning app for iOS and Android",
  },
  {
    icon: "/images/icons/globe-alt.svg",
    title: "Online banking",
    desc: "Full-featured banking in your browser",
  },
  {
    icon: "/images/icons/phone.svg",
    title: "Telephone banking",
    desc: "24/7 UK-based phone support",
  },
  {
    icon: "/images/icons/map-pin.svg",
    title: "Branches & ATMs",
    desc: "Over 800 branches across the UK",
  },
];

const channels = [
  {
    name: "NexusBank Mobile App",
    image: "/images/sections/app-screenshot.webp",
    tag: "Most popular",
    headline: "Bank from anywhere",
    description:
      "Our award-winning mobile app lets you manage your money on the go. Check balances, make payments, freeze your card, and get instant spending insights.",
    features: [
      "Check balances and recent transactions",
      "Make payments and transfers instantly",
      "Freeze and unfreeze your card in seconds",
      "Set up and manage Direct Debits",
      "Deposit cheques using your camera",
      "Real-time spending notifications",
    ],
    href: "/ways-to-bank",
  },
  {
    name: "Online Banking",
    image: "/images/channels/banking-hub.jpg",
    tag: null,
    headline: "Full access via browser",
    description:
      "Access your accounts from any device with a web browser. View statements, manage payees, apply for products, and update your personal details.",
    features: [
      "View and download statements",
      "Manage standing orders and Direct Debits",
      "Apply for new products online",
      "Update personal details and address",
      "Set up new payees with Confirmation of Payee",
      "Secure with two-factor authentication",
    ],
    href: "/login",
  },
  {
    name: "Telephone Banking",
    image: "/images/channels/telephone-banking.jpg",
    tag: "24/7",
    headline: "Speak to a person",
    description:
      "Our UK-based telephone banking team is available around the clock. Get help with your accounts, report fraud, or make transactions over the phone.",
    features: [
      "Available 24 hours a day, 7 days a week",
      "UK-based customer service team",
      "Report lost or stolen cards immediately",
      "Make payments and check balances",
      "Automated services for quick tasks",
      "Premier customers get a priority line",
    ],
    href: "/help",
  },
  {
    name: "Branches & ATMs",
    image: "/images/channels/branch-banking.jpeg",
    tag: "In person",
    headline: "Face-to-face support",
    description:
      "Visit one of over 800 NexusBank branches for in-person help. Our branch colleagues can assist with everything from opening accounts to mortgage advice.",
    features: [
      "Over 800 branches across the UK",
      "Book appointments online or in-app",
      "Fee-free NexusBank ATMs nationwide",
      "Cash and cheque deposit machines",
      "Mortgage and investment appointments",
      "Accessible branches with hearing loops",
    ],
    href: "/help",
  },
];

const appFeatures = [
  {
    icon: "/images/icons/bell-alert.svg",
    title: "Instant alerts",
    desc: "Get notified the moment a transaction hits your account.",
  },
  {
    icon: "/images/icons/shield-check.svg",
    title: "Biometric login",
    desc: "Sign in securely with Face ID, Touch ID, or fingerprint.",
  },
  {
    icon: "/images/icons/wallet.svg",
    title: "Apple Pay & Google Pay",
    desc: "Add your card to your digital wallet for contactless payments.",
  },
];

/* ── page ──────────────────────────────────────────────────────────── */

export default function WaysToBankPage() {
  return (
    <>
      {/* ── Dark gradient hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1a3e] via-[#102a5c] to-[#0e2350]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,174,239,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-14 lg:py-20 relative grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
              Ways to Bank
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white max-w-2xl leading-tight">
              Bank your way, wherever you are
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/70 leading-relaxed">
              From our award-winning mobile app to in-branch appointments, choose
              the way that works best for you. We&apos;re here 24/7.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
              >
                Download the app
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:bg-white/5 transition"
              >
                Log in to online banking
              </Link>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <Image
              src="/images/hero/hero-ways-to-bank.jpeg"
              alt="Ways to bank with NexusBank"
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

      {/* ── Channels ────────────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Choose how you bank
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            All the ways you can manage your money with NexusBank
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {channels.map((c) => (
              <div
                key={c.name}
                className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                {c.image && (
                  <div className="relative h-40 -mx-6 -mt-6 mb-5 overflow-hidden rounded-t-xl">
                    <Image
                      src={c.image}
                      alt={c.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
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
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Banking locations ─────────────────────────────────────── */}
      <section className="border-t border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Find us near you
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Access your banking wherever works best for you
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Post Office Banking", desc: "Withdraw cash, check your balance and make deposits at 11,500 Post Office branches.", image: "/images/channels/post-office.jpeg" },
              { title: "Local Banking Hubs", desc: "Shared banking hubs offering counter services from multiple banks in one location.", image: "/images/channels/local-banking.jpg" },
              { title: "Find a Location", desc: "Search for NexusBank branches, ATMs, and Post Office locations near you.", image: "/images/channels/locations.jpg" },
            ].map((loc) => (
              <div key={loc.title} className="rounded-xl border border-border bg-white dark:bg-card overflow-hidden transition-all hover:border-primary/40 hover:shadow-md">
                <div className="relative h-40">
                  <Image src={loc.image} alt={loc.title} fill className="object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-bold mb-1">{loc.title}</h3>
                  <p className="text-xs text-muted-foreground">{loc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── App features ────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            App highlights
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            A few reasons our app is rated 4.8 stars
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            {appFeatures.map((a) => (
              <div
                key={a.title}
                className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mb-4">
                  <ContentIcon src={a.icon} size={22} />
                </div>
                <h3 className="text-sm font-bold">{a.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mx-auto mb-4">
            <ContentIcon src="/images/icons/device-phone-mobile.svg" size={22} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Get started with the NexusBank app
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
            Download the app from the App Store or Google Play and start banking
            smarter today. It takes less than five minutes to get set up.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
          >
            Download the app
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
