import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/brand/logo";
import { TrustBadges } from "@/components/brand/trust-badges";
import { ContentIcon } from "@/components/shared/content-icon";
import { Search, ChevronDown, Menu, ArrowRight } from "lucide-react";

/* ── Navigation structure (Barclays-style mega-menu categories) ──────── */

const navCategories: {
  label: string;
  groups: { heading: string; items: string[] }[];
}[] = [
  {
    label: "Accounts",
    groups: [
      {
        heading: "Accounts",
        items: [
          "Current Accounts",
          "Premier Current Account",
          "Basic Current Account",
          "Student Additions Account",
          "Compare Accounts",
        ],
      },
      {
        heading: "Rewards",
        items: ["NexusBank Blue Rewards", "Premier Rewards"],
      },
      {
        heading: "Tools and services",
        items: ["Switch to NexusBank", "NexusBank app", "Online banking"],
      },
      {
        heading: "Help",
        items: ["Help with your account", "Lost or stolen card", "Contact us"],
      },
    ],
  },
  {
    label: "Mortgages",
    groups: [
      {
        heading: "Mortgages",
        items: [
          "Mortgage rates",
          "First-time buyers",
          "Remortgage",
          "Buy to let",
          "Moving home",
        ],
      },
      {
        heading: "Tools",
        items: [
          "Mortgage calculator",
          "How much can I borrow",
          "Agreement in principle",
        ],
      },
      {
        heading: "Help",
        items: ["Manage your mortgage", "Mortgage help and guidance"],
      },
    ],
  },
  {
    label: "Loans",
    groups: [
      {
        heading: "Loans",
        items: ["Personal loans", "Car finance", "Debt consolidation"],
      },
      {
        heading: "Tools",
        items: ["Loan calculator", "Check your rate"],
      },
      {
        heading: "Help",
        items: ["Manage your loan", "Loan help and guidance"],
      },
    ],
  },
  {
    label: "Credit cards",
    groups: [
      {
        heading: "Credit cards",
        items: [
          "Compare credit cards",
          "Rewards credit card",
          "Purchase credit card",
          "Balance transfer card",
          "Platinum card",
        ],
      },
      {
        heading: "Tools and services",
        items: ["Check your eligibility", "Manage your credit card"],
      },
      {
        heading: "Help",
        items: [
          "Credit card help and guidance",
          "How to pay off your credit card",
        ],
      },
    ],
  },
  {
    label: "Savings",
    groups: [
      {
        heading: "Savings",
        items: [
          "Compare savings",
          "Easy access savings",
          "Cash ISAs",
          "Fixed rate bonds",
          "Notice accounts",
        ],
      },
      {
        heading: "Children's savings",
        items: ["Junior Cash ISA", "Children's savings account"],
      },
      {
        heading: "Help",
        items: ["Savings help and guidance", "Savings calculator"],
      },
    ],
  },
  {
    label: "Investments",
    groups: [
      {
        heading: "Investments",
        items: [
          "Stocks & Shares ISA",
          "Ready-made investments",
          "Self-directed trading",
          "Pensions (SIPP)",
        ],
      },
      {
        heading: "Children's investments",
        items: ["Junior ISA"],
      },
      {
        heading: "Help",
        items: ["Investment guidance", "Your investment options explained"],
      },
    ],
  },
  {
    label: "Insurance",
    groups: [
      {
        heading: "Insurance",
        items: ["Home insurance", "Life insurance", "Travel insurance"],
      },
      {
        heading: "Help",
        items: ["Insurance help and guidance", "How to make a claim"],
      },
    ],
  },
  {
    label: "Ways to bank",
    groups: [
      {
        heading: "Digital banking",
        items: ["NexusBank app", "Online banking", "Manage your settings"],
      },
      {
        heading: "In person",
        items: ["Branch finder", "Book an appointment"],
      },
      {
        heading: "Help",
        items: ["Security centre", "Report fraud or a scam", "Contact us"],
      },
    ],
  },
];

/* ── Mega-menu category → product page mapping ──────────────────────── */

const navCategoryHrefs: Record<string, string> = {
  Accounts: "/current-accounts",
  Mortgages: "/mortgages",
  Loans: "/loans",
  "Credit cards": "/credit-cards",
  Savings: "/savings",
  Investments: "/investments",
  Insurance: "/insurance",
  "Ways to bank": "/ways-to-bank",
};

/* ── Product tiles ────────────────────────────────────────────────────── */

const productTiles = [
  {
    iconSrc: "/images/icons/wallet.svg",
    title: "Current accounts",
    desc: "Find a current account that works for you.",
    href: "/current-accounts",
  },
  {
    iconSrc: "/images/icons/credit-card.svg",
    title: "Credit cards",
    desc: "Choice is the key to finding the right credit card.",
    href: "/credit-cards",
  },
  {
    iconSrc: "/images/icons/banknotes.svg",
    title: "Savings accounts",
    desc: "Whatever you're dreaming of, you can start saving today.",
    href: "/savings",
  },
  {
    iconSrc: "/images/icons/currency-pound.svg",
    title: "Loans",
    desc: "Focus on the future with a personal loan.",
    href: "/loans",
  },
  {
    iconSrc: "/images/icons/home.svg",
    title: "Mortgages",
    desc: "Take a look at the range of mortgages we can offer to help with your plans.",
    href: "/mortgages",
  },
  {
    iconSrc: "/images/icons/shield-check.svg",
    title: "Insurance",
    desc: "A safety net for unpredictable events.",
    href: "/insurance",
  },
  {
    iconSrc: "/images/icons/arrow-trending-up.svg",
    title: "Investments",
    desc: "Whether you're a beginner, an expert or somewhere in between — we can help you make the most of your money.",
    href: "/investments",
  },
  {
    iconSrc: "/images/icons/sparkles.svg",
    title: "Subscriptions",
    desc: "Start enjoying your favourite subscriptions through the NexusBank app.",
    href: "/ways-to-bank",
  },
];

/* ── Footer columns ──────────────────────────────────────────────────── */

const footerCols = [
  {
    heading: "Our products",
    links: [
      { label: "Current accounts", href: "/current-accounts" },
      { label: "Savings accounts", href: "/savings" },
      { label: "Credit cards", href: "/credit-cards" },
      { label: "Mortgages", href: "/mortgages" },
      { label: "Loans", href: "/loans" },
      { label: "Insurance", href: "/insurance" },
      { label: "Investments", href: "/investments" },
    ],
  },
  {
    heading: "Ways to bank",
    links: [
      { label: "NexusBank app", href: "/ways-to-bank" },
      { label: "Online banking", href: "/login" },
      { label: "Find a branch", href: "/ways-to-bank" },
      { label: "Book an appointment", href: "/ways-to-bank" },
      { label: "Service status", href: "/help" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "Help and FAQs", href: "/help" },
      { label: "Switch to NexusBank", href: "/current-accounts" },
      { label: "Report fraud or a scam", href: "/help" },
      { label: "Protect yourself from scams", href: "/help" },
      { label: "Contact us", href: "/complaints" },
    ],
  },
  {
    heading: "About us",
    links: [
      { label: "About NexusBank", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press Office", href: "/about" },
      { label: "Investor relations", href: "/about" },
      { label: "Sustainability", href: "/about" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Accessibility", href: "/accessibility" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookies", href: "/cookies" },
      { label: "Terms and conditions", href: "/terms" },
      { label: "Complaints", href: "/complaints" },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div id="top" className="min-h-screen bg-white dark:bg-background">
      {/* ── Top utility bar ───────────────────────────────────────────── */}
      <div className="border-b border-border/40 bg-[#f8f8f8] dark:bg-muted/30">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 lg:px-8">
          <div className="hidden md:flex items-center gap-0.5 text-xs">
            {[
              "Personal",
              "Premier",
              "Private Bank",
              "Business",
              "Corporate",
              "International Banking",
            ].map((label, i) => (
              <Link
                key={label}
                href={
                  i === 0
                    ? "/"
                    : i === 1
                      ? "/premier-banking"
                      : i === 3
                        ? "/register/business"
                        : "/about"
                }
                className={
                  i === 0
                    ? "border-b-2 border-primary px-3 py-2 font-semibold text-primary"
                    : "px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                }>
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4 ml-auto text-xs">
            <Link
              href="/register"
              className="hidden sm:inline text-muted-foreground hover:text-foreground transition-colors">
              Register
            </Link>
            <Link
              href="/complaints"
              className="hidden sm:inline text-muted-foreground hover:text-foreground transition-colors">
              Contact us
            </Link>
            <Link
              href="/ways-to-bank"
              className="hidden sm:inline text-muted-foreground hover:text-foreground transition-colors">
              Find NexusBank
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-[0_2px_6px_rgba(0,0,0,0.1)] hover:brightness-105 transition-all">
              Log in
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main navigation ───────────────────────────────────────────── */}
      <nav className="border-b border-border/40 bg-white dark:bg-card sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link href="/" aria-label="NexusBank Home">
            <Logo size="sm" />
          </Link>

          <div className="hidden lg:flex items-center gap-0">
            {navCategories.map((cat) => {
              const catHref = navCategoryHrefs[cat.label] ?? "/help";
              return (
                <div key={cat.label} className="relative group">
                  <button className="flex items-center gap-1 px-3 py-4 text-[13px] font-medium text-foreground/80 hover:text-primary transition-colors border-b-2 border-transparent group-hover:border-primary">
                    {cat.label}
                    <ChevronDown className="h-3 w-3 opacity-40" />
                  </button>

                  <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute top-full left-0 pt-0 z-50">
                    <div className="flex gap-0 border border-border bg-white dark:bg-card shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                      {cat.groups.map((group) => (
                        <div
                          key={group.heading}
                          className="min-w-[200px] border-r last:border-r-0 border-border/40 py-3 px-1">
                          <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-wider text-foreground/40">
                            {group.heading}
                          </p>
                          {group.items.map((item) => (
                            <Link
                              key={item}
                              href={catHref}
                              className="block px-4 py-1.5 text-sm text-muted-foreground hover:text-primary hover:bg-[#f2f2f2] dark:hover:bg-muted transition-colors">
                              {item}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
            <button
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Menu">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Banner — Switching offer ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1a3e] via-[#102a5c] to-[#0e2350]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,174,239,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-14 lg:py-20 relative">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">
                Personal Banking
              </p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                Get £400 when you switch
              </h1>
              <p className="mt-5 text-base text-white/70 leading-relaxed max-w-xl">
                Open a Premier Current Account and switch to us in the NexusBank
                app by 30 April 2026* to get £400. UK residents and 18+ only.
                T&amp;Cs and eligibility apply.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/current-accounts"
                  className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:bg-[#009bd6] transition-all">
                  Switch now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-full border-2 border-white/30 px-7 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all">
                  Log in to banking
                </Link>
              </div>
              <p className="mt-6 text-[10px] text-white/40 leading-relaxed max-w-xl">
                *To be eligible, (1) use the NexusBank app to open a sole
                Premier Current Account (eligibility criteria apply), (2)
                initiate a full switch (including two active direct debits) by
                30 Apr 2026, (3) complete the switch &amp; (4) deposit £4,000,
                all within 30 days. T&amp;Cs apply. New customers, 18+ &amp; UK
                residents only.
              </p>
            </div>
            <div className="hidden lg:block">
              <Image
                src="/images/hero/hero.svg"
                alt="Person managing their finances on a laptop"
                width={800}
                height={600}
                className="rounded-2xl object-cover shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Your experience starts here ───────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Your NexusBank experience starts here
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              See how we can help you with current accounts, mortgages,
              insurance, loans, credit cards and savings accounts.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {productTiles.map((tile) => (
              <Link
                key={tile.title}
                href={tile.href}
                className="group flex flex-col rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mb-4">
                  <ContentIcon src={tile.iconSrc} size={24} />
                </div>
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {tile.title}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed flex-1">
                  {tile.desc}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── ISA Allowance promo ────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="accent-bar mb-5" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Time is money
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-lg">
                You only have until 5 April to make the most of your £20,000 ISA
                allowance. You won&apos;t pay tax on any money you make, so take
                a look at our cash and Investment ISAs today.
              </p>
              <p className="mt-3 text-[11px] text-muted-foreground/50">
                Terms, conditions and ISA rules apply. With investments, capital
                is at risk.
              </p>
              <Link
                href="/savings"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-4">
                Explore ISA options <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="hidden lg:block">
              <Image
                src="/images/sections/time.jpg"
                alt="Savings and investment concept"
                width={800}
                height={600}
                className="rounded-2xl object-cover shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Children and money ─────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="rounded-xl border border-border bg-white dark:bg-card overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="relative h-48 md:h-auto">
                <Image
                  src="/images/sections/children.jpg"
                  alt="Child learning about money and saving"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8 lg:p-10 flex flex-col justify-center">
                <h3 className="text-xl font-bold">Children and money</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Whether you&apos;re a parent, grandparent or guardian,
                  we&apos;ll help you understand the financial world of the
                  children in your life, so they can build great habits from an
                  early age.
                </p>
                <Link
                  href="/savings"
                  className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:brightness-105 transition-all w-fit">
                  Learn more <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mobile App section ─────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-gradient-to-br from-[#0b1a3e] via-[#102a5c] to-[#0e2350] py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">
                NexusBank App
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Join the 12 million customers banking in our app
              </h2>
              <p className="mt-4 text-white/60 leading-relaxed max-w-lg">
                Banking made simple, secure and always within reach — whether
                you&apos;re checking your balance, sending money, or managing
                your spending.
              </p>

              <div className="mt-6 flex items-start gap-4 rounded-lg bg-white/[0.06] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <ContentIcon
                    src="/images/icons/device-phone-mobile.svg"
                    size={20}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Powerful features at your fingertips
                  </h3>
                  <p className="mt-1 text-xs text-white/50 leading-relaxed">
                    From smart budgeting tools to instant notifications and card
                    controls, the NexusBank app helps you stay in control —
                    wherever life takes you.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <a href="#" className="hover:opacity-80 transition-opacity">
                  <Image
                    src="/apple-store.svg"
                    alt="Download on the App Store"
                    width={144}
                    height={48}
                  />
                </a>
                <a href="#" className="hover:opacity-80 transition-opacity">
                  <Image
                    src="/google-play.svg"
                    alt="Get it on Google Play"
                    width={162}
                    height={48}
                  />
                </a>
              </div>

              <p className="mt-4 text-[10px] text-white/30">
                You need to be 18 or over to access this product or service
                using the app. Terms and conditions apply.
              </p>
            </div>

            {/* App lifestyle image */}
            <div className="hidden lg:flex justify-center">
              <Image
                src="/images/sections/app.svg"
                alt="Customer using the NexusBank app on their smartphone"
                width={800}
                height={600}
                className="rounded-2xl object-cover shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Explore Premier Banking ────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="accent-bar mb-5" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Explore Premier Banking
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-lg">
                Discover a world of Premier benefits and perks, with access to
                exclusive savings rates and mortgage options, 24/7 UK-based
                support and higher payment limits. T&amp;Cs apply.
              </p>
              <Link
                href="/premier-banking"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-white hover:brightness-105 transition-all">
                Explore Premier <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="hidden lg:block">
              <Image
                src="/images/sections/premier-banking.jpg"
                alt="Premium banking experience"
                width={800}
                height={600}
                className="rounded-2xl object-cover shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Independent service quality survey ─────────────────────────── */}
      <section className="border-y border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Independent service quality survey results
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Personal current accounts
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              An independent survey asked customers if they would recommend
              their personal current account provider to friends and family.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
            <div className="rounded-xl border border-border bg-white dark:bg-card p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Great Britain
              </p>
              <div className="flex items-center justify-center gap-2">
                <ContentIcon src="/images/icons/hand-thumb-up.svg" size={20} />
                <span className="text-3xl font-bold text-primary">63%</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                would recommend
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white dark:bg-card p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Northern Ireland
              </p>
              <div className="flex items-center justify-center gap-2">
                <ContentIcon src="/images/icons/hand-thumb-up.svg" size={20} />
                <span className="text-3xl font-bold text-primary">71%</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                would recommend
              </p>
            </div>
          </div>

          <p className="mt-6 text-[10px] text-muted-foreground/50 text-center max-w-2xl mx-auto">
            The Financial Conduct Authority also requires us to publish
            information about service. The requirement to publish the Financial
            Conduct Authority Service Quality Information for personal current
            accounts can be found on our website.
          </p>
        </div>
      </section>

      {/* ── APP Scams section ──────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Authorised push payment (APP) scams rankings in 2023
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-3xl mx-auto">
              Authorised push payment (APP) fraud happens when someone is
              tricked into transferring money to a fraudster&apos;s bank
              account. These charts use data given to the Payment Systems
              Regulator (PSR) by major banking groups in the UK in 2023.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-white dark:bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-2">
                Share of APP scams refunded
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The proportion of total APP fraud losses that were reimbursed,
                ranked out of 14 firms.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white dark:bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-2">
                APP scams sent per £M transactions
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The amount of money sent from the victim&apos;s account to the
                scammer, ranked out of 14 firms. For every £1 million of
                NexusBank transactions sent in 2023, £135 was lost to APP scams.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white dark:bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-2">
                APP scams received: smaller firms
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The amount of money received into the scammer&apos;s account
                from the victim, ranked out of all UK banks and payment firms.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white dark:bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-2">
                APP scams received: major banks
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For every £1 million received into consumer&apos;s accounts at
                NexusBank, £67 of it was APP scams.
              </p>
            </div>
          </div>

          <p className="mt-4 text-[10px] text-muted-foreground/50 text-center">
            You can read the full report by visiting the Payment Systems
            Regulator website.
          </p>
        </div>
      </section>

      {/* ── Open account CTA with app download ────────────────────────── */}
      <section className="border-y border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Open a NexusBank Account
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Download the app and begin your application. T&amp;Cs and
              eligibility apply. 18+ and UK only.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Image
                  src="/apple-store.svg"
                  alt="Download on the App Store"
                  width={144}
                  height={48}
                />
              </a>
              <a href="#" className="hover:opacity-80 transition-opacity">
                <Image
                  src="/google-play.svg"
                  alt="Get it on Google Play"
                  width={162}
                  height={48}
                />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Was this helpful? ──────────────────────────────────────────── */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">Was this helpful?</p>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors">
                <ContentIcon src="/images/icons/hand-thumb-up.svg" size={14} />
                Yes
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors">
                <svg
                  className="h-3.5 w-3.5 rotate-180"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M7 10V4h10l4 7v9a2 2 0 0 1-2 2h-5.5a1 1 0 0 1-.8-.4l-4.9-6.5a1 1 0 0 1 .3-1.4V10z" />
                  <path d="M7 10H3v7h4" />
                </svg>
                No
              </button>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground/50 text-center">
            Your feedback helps us improve your experience.
          </p>
        </div>
      </section>

      {/* ── Return to top ────────────────────────────────────────────── */}
      <div className="border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-4 text-center">
          <a
            href="#top"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-4 transition-colors">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M18 15l-6-6-6 6" />
            </svg>
            Return to top
          </a>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="footer-dark">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-12">
          {/* ── Follow us + App download ──────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-10 border-b border-white/10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
                Follow us
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-colors">
                  <Image
                    src="/icon-facebook.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-90"
                  />
                </a>
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-colors">
                  <Image
                    src="/icon-linkedin.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="opacity-90"
                  />
                </a>
                <a
                  href="#"
                  aria-label="X (Twitter)"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-colors">
                  <Image
                    src="/icon-x.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="brightness-0 invert opacity-90"
                  />
                </a>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
                Download the NexusBank app
              </p>
              <div className="flex gap-2.5">
                <a href="#" className="hover:opacity-80 transition-opacity">
                  <Image
                    src="/apple-store.svg"
                    alt="Download on the App Store"
                    width={120}
                    height={40}
                  />
                </a>
                <a href="#" className="hover:opacity-80 transition-opacity">
                  <Image
                    src="/google-play.svg"
                    alt="Get it on Google Play"
                    width={135}
                    height={40}
                  />
                </a>
              </div>
            </div>
          </div>

          {/* ── Link columns ──────────────────────────────────────────── */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 pt-10">
            {footerCols.map((col) => (
              <div key={col.heading}>
                <h4 className="text-sm font-bold text-white mb-4">
                  {col.heading}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/60 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* ── Trust badges ──────────────────────────────────────────── */}
          <div className="mt-10 pt-8 border-t border-white/10">
            <TrustBadges variant="dark" />
          </div>

          {/* ── Regulatory + copyright ────────────────────────────────── */}
          <div className="mt-8 pt-8 border-t border-white/10 space-y-3">
            <p className="text-xs text-white/30 leading-relaxed max-w-4xl">
              NexusBank UK PLC and NexusBank PLC are each authorised by the
              Prudential Regulation Authority and regulated by the Financial
              Conduct Authority and the Prudential Regulation Authority.
            </p>
            <p className="text-xs text-white/30 leading-relaxed max-w-4xl">
              NexusBank Investment Solutions Limited is authorised and regulated
              by the Financial Conduct Authority.
            </p>
            <p className="text-xs text-white/30 leading-relaxed max-w-4xl">
              Registered office for all: 1 Churchill Place, London E14 5HP.
            </p>
            <p className="text-xs text-white/20 pt-2">
              &copy; {new Date().getFullYear()} NexusBank. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
