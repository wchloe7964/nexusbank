import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ContentIcon } from "@/components/shared/content-icon";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Current Accounts | NexusBank",
  description:
    "Compare NexusBank current accounts. Everyday banking, Blue Rewards, and Premier — find the account that suits your needs.",
};

/* ── types ─────────────────────────────────────────────────────────── */

interface ComparisonFeature {
  label: string;
  values: (string | boolean | null)[];
  footnote?: number;
}

interface ComparisonCategory {
  heading: string;
  icon: string;
  features: ComparisonFeature[];
}

/* ── data ──────────────────────────────────────────────────────────── */

const mainAccounts = [
  {
    name: "NexusBank Current Account",
    shortName: "Current Account",
    tag: null,
    monthlyFee: "£0",
    feeNote: "No monthly fee",
    href: "/register?type=current",
    highlight: false,
  },
  {
    name: "Current Account + Blue Rewards",
    shortName: "Blue Rewards",
    tag: "Popular",
    monthlyFee: "£5",
    feeNote: "per month, cancel anytime",
    href: "/register?type=current-rewards",
    highlight: true,
  },
  {
    name: "Premier Current Account",
    shortName: "Premier",
    tag: "Premium",
    monthlyFee: "£0",
    feeNote: "Income criteria apply",
    href: "/register?type=premier",
    highlight: false,
  },
];

const comparisonCategories: ComparisonCategory[] = [
  {
    heading: "Fees and eligibility",
    icon: "/images/icons/wallet.svg",
    features: [
      {
        label: "Monthly fee",
        values: ["No monthly fee", "£5 per month", "No monthly fee"],
      },
      {
        label: "Eligibility",
        values: [
          "UK resident, 18+",
          "UK resident, 18+, NexusBank Current Account required",
          "Annual income £75,000+ or £100,000+ in savings/investments",
        ],
      },
    ],
  },
  {
    heading: "Spending",
    icon: "/images/icons/credit-card.svg",
    features: [
      {
        label: "Personalised Visa debit card",
        values: [true, true, true],
      },
      {
        label: "Apple Pay & Google Pay",
        values: [true, true, true],
        footnote: 1,
      },
      {
        label: "Money management tools",
        values: [true, true, true],
      },
      {
        label: "Optional arranged overdraft",
        values: [true, true, true],
        footnote: 2,
      },
      {
        label: "Daily cash withdrawal limit",
        values: ["£300", "£300", "£2,000"],
        footnote: 3,
      },
    ],
  },
  {
    heading: "Our highest savings rates",
    icon: "/images/icons/chart-bar.svg",
    features: [
      {
        label: "Rainy Day Saver (instant access)",
        values: [
          "Up to 1.85% AER",
          "Up to 4.21% AER",
          "Up to 4.21% AER",
        ],
        footnote: 4,
      },
    ],
  },
  {
    heading: "Perks",
    icon: "/images/icons/gift.svg",
    features: [
      {
        label: "Apple TV+ (3-month trial)",
        values: [false, true, true],
        footnote: 5,
      },
      {
        label: "NexusBank Cashback Rewards",
        values: [false, true, true],
        footnote: 6,
      },
      {
        label: "NexusBank Avios Rewards",
        values: [false, false, "£12 a month"],
        footnote: 7,
      },
    ],
  },
  {
    heading: "Support",
    icon: "/images/icons/phone.svg",
    features: [
      {
        label: "App & Online Banking",
        values: [true, true, true],
        footnote: 8,
      },
      {
        label: "24/7 Telephone Banking",
        values: [true, true, true],
      },
      {
        label: "Premier Financial Guides",
        values: [false, false, true],
      },
    ],
  },
];

const studentAccounts = [
  {
    name: "Student Additions Account",
    tag: "Students",
    icon: "/images/icons/academic-cap.svg",
    description:
      "Get more from your everyday banking with our account designed for student life. Eligibility, terms and conditions apply.",
    features: [
      "No monthly fee",
      "Up to £1,500 interest-free overdraft",
      "Contactless Visa debit card",
      "Exclusive student discounts & offers",
      "Budgeting tools in the NexusBank app",
      "Apple Pay & Google Pay",
    ],
    href: "/register?type=student",
  },
  {
    name: "Higher Education Account",
    tag: "Graduates",
    icon: "/images/icons/academic-cap.svg",
    description:
      "Whether you\u2019re looking to start your first job or travel the world, take the next step with this account \u2014 it\u2019s available for three years after you graduate. Eligibility, terms and conditions apply.",
    features: [
      "No monthly fee",
      "Interest-free overdraft (decreasing over 3 years)",
      "All the features of a NexusBank Current Account",
      "Manage everything in the app",
    ],
    href: "/register?type=graduate",
  },
];

const under18Account = {
  name: "NexusBank Young Persons Account",
  tag: "Ages 11\u201317",
  icon: "/images/icons/user-group.svg",
  description:
    "Whether they\u2019re saving pocket money or getting their first part-time job, our bank account for children and teens is made to help 11 to 17 year olds manage money for themselves.",
  features: [
    "No monthly fee",
    "Contactless Visa debit card",
    "Parental controls in the app",
    "Real-time spending notifications",
    "Set savings goals together",
  ],
  href: "/register?type=young-person",
};

const basicAccount = {
  name: "NexusBank Basic Current Account",
  tag: null,
  icon: "/images/icons/wallet.svg",
  description:
    "If you\u2019re not eligible for our current accounts, don\u2019t yet have a UK account, or you\u2019re experiencing financial difficulties, a NexusBank Basic Account could be right for you. Eligibility, terms and conditions apply.",
  features: [
    "No monthly fee, no credit check",
    "Visa debit card for purchases",
    "Cash withdrawals at any ATM",
    "Direct Debits & standing orders",
    "Mobile & online banking access",
    "Salary or benefits payments",
  ],
  href: "/register?type=basic",
};

const footnotes = [
  "Google Pay and Google Wallet are trademarks of Google LLC.",
  "Overdrafts are subject to status. An arranged overdraft is available from £1 up to an agreed limit. Interest is charged at a single annual rate (EAR) on your arranged and unarranged overdraft balances. See our rates and charges for full details.",
  "Subject to status and available funds. Individual cash machine limits may apply. Premier customers can increase their cash machine withdrawal limit from £1,000 to £2,000 in the NexusBank app.",
  "\u2018Gross\u2019 is the rate payable without tax taken off. \u2018AER\u2019 (Annual Equivalent Rate) shows what the interest rate would be if interest was paid and compounded once each year. Interest is calculated daily using your statement balance and paid monthly on the first working day of the month.",
  "Apple TV+ offer: Requires an Apple ID. New or qualified returning subscribers only. Free for 3 months, then £8.99/month. Plan auto-renews until cancelled. Terms apply.",
  "NexusBank Cashback Rewards terms and conditions are separate from the Blue Rewards terms and conditions. To earn cashback you need to spend using the NexusBank debit or credit Visa card linked to your cashback account and follow the individual retailer offer terms.",
  "You can opt in to NexusBank Avios Rewards if you\u2019re a Premier Banking customer \u2014 you\u2019ll need to register for the NexusBank app and have a British Airways Executive Club account too. There\u2019s a £12 monthly fee. T&Cs apply.",
  "You need to be 18 or over to access this product or service using the app. T&Cs apply.",
];

/* ── helpers ───────────────────────────────────────────────────────── */

function renderValue(value: string | boolean | null) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center text-primary">
        <ContentIcon src="/images/icons/check-circle.svg" size={18} />
      </span>
    );
  }
  if (value === false || value === null) {
    return <span className="text-muted-foreground/40">&mdash;</span>;
  }
  return <span>{value}</span>;
}

/* ── page ──────────────────────────────────────────────────────────── */

export default function CurrentAccountsPage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1a3e] via-[#102a5c] to-[#0e2350]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,174,239,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-14 lg:py-20 relative">
          <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
            NexusBank Current Accounts
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white max-w-2xl leading-tight">
            Current accounts
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 leading-relaxed">
            Everything you need for your everyday banking, from a bank you can
            trust. Compare our accounts and find the one that suits you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register?type=current"
              className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
            >
              Open an account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register?type=switch"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:bg-white/5 transition"
            >
              Switch to NexusBank
            </Link>
          </div>
        </div>
      </section>

      {/* ── Compare current accounts (intro) ──────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Compare current accounts
          </h2>
          <p className="text-sm text-muted-foreground max-w-3xl mb-10 leading-relaxed">
            Take a look at the benefits of the NexusBank Current Account &mdash;
            plus the extras you can get by joining Blue Rewards &mdash; and see
            the perks you can get with a Premier Current Account.
          </p>

          {/* ── Desktop comparison table ─────────────────────────── */}
          <div className="hidden lg:block rounded-xl border border-border bg-white dark:bg-card overflow-hidden">
            {/* Account header row */}
            <div className="grid grid-cols-[minmax(220px,1.2fr)_repeat(3,1fr)] border-b border-border/40">
              <div className="p-6 flex items-end">
                <p className="text-xs text-muted-foreground">
                  Select an account to compare features
                </p>
              </div>
              {mainAccounts.map((a) => (
                <div
                  key={a.name}
                  className={`p-6 text-center ${a.highlight ? "bg-primary/[0.03] border-x border-primary/10" : ""}`}
                >
                  {a.tag && (
                    <span className="inline-block rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary mb-3">
                      {a.tag}
                    </span>
                  )}
                  <h3 className="text-sm font-bold leading-snug">
                    {a.name}
                  </h3>
                  <p className="text-3xl font-bold text-primary mt-2">
                    {a.monthlyFee}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {a.feeNote}
                  </p>
                  <Link
                    href={a.href}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:brightness-105 transition mt-4"
                  >
                    Apply now
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>

            {/* Comparison categories */}
            {comparisonCategories.map((cat) => (
              <div key={cat.heading}>
                {/* Category header */}
                <div className="grid grid-cols-[minmax(220px,1.2fr)_repeat(3,1fr)] bg-[#f8f8f8] dark:bg-muted/20 border-y border-border/40">
                  <div className="col-span-4 flex items-center gap-3 px-6 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.07]">
                      <ContentIcon src={cat.icon} size={16} />
                    </div>
                    <p className="text-sm font-bold">{cat.heading}</p>
                  </div>
                </div>

                {/* Feature rows */}
                {cat.features.map((feat, fi) => (
                  <div
                    key={feat.label}
                    className={`grid grid-cols-[minmax(220px,1.2fr)_repeat(3,1fr)] ${fi < cat.features.length - 1 ? "border-b border-border/20" : ""}`}
                  >
                    <div className="px-6 py-3.5 text-sm text-muted-foreground flex items-center gap-1">
                      {feat.label}
                      {feat.footnote && (
                        <sup className="text-[10px] text-primary/60 font-semibold ml-0.5">
                          ({feat.footnote})
                        </sup>
                      )}
                    </div>
                    {feat.values.map((val, vi) => (
                      <div
                        key={vi}
                        className={`px-6 py-3.5 text-sm text-center flex items-center justify-center ${mainAccounts[vi]?.highlight ? "bg-primary/[0.015]" : ""}`}
                      >
                        {renderValue(val)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}

            {/* Bottom CTA row */}
            <div className="grid grid-cols-[minmax(220px,1.2fr)_repeat(3,1fr)] border-t border-border/40">
              <div className="p-6">
                <p className="text-[10px] text-muted-foreground/50">
                  Eligibility criteria, terms and conditions apply
                </p>
              </div>
              {mainAccounts.map((a) => (
                <div
                  key={a.name}
                  className={`p-6 text-center ${a.highlight ? "bg-primary/[0.03] border-x border-primary/10" : ""}`}
                >
                  <Link
                    href={a.href}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:brightness-105 transition"
                  >
                    Apply now
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* ── Mobile comparison cards ───────────────────────────── */}
          <div className="lg:hidden space-y-6">
            {mainAccounts.map((a) => (
              <div
                key={a.name}
                className={`rounded-xl border bg-white dark:bg-card p-6 ${a.highlight ? "border-primary/30 shadow-md" : "border-border"}`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold leading-snug pr-2">
                    {a.name}
                  </h3>
                  {a.tag && (
                    <span className="shrink-0 rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary">
                      {a.tag}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-primary">
                  {a.monthlyFee}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {a.feeNote}
                  </span>
                </p>

                <Link
                  href={a.href}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:brightness-105 transition mt-4 mb-5"
                >
                  Apply now
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                {/* Feature categories */}
                {comparisonCategories.map((cat, ci) => {
                  const accountIdx = mainAccounts.indexOf(a);
                  return (
                    <div
                      key={cat.heading}
                      className={ci > 0 ? "border-t border-border/20 pt-4 mt-4" : ""}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/[0.07]">
                          <ContentIcon src={cat.icon} size={14} />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          {cat.heading}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {cat.features.map((feat) => (
                          <div
                            key={feat.label}
                            className="flex items-start justify-between gap-3 text-sm"
                          >
                            <span className="text-muted-foreground">
                              {feat.label}
                              {feat.footnote && (
                                <sup className="text-[10px] text-primary/60 font-semibold ml-0.5">
                                  ({feat.footnote})
                                </sup>
                              )}
                            </span>
                            <span className="shrink-0 font-medium text-right">
                              {renderValue(feat.values[accountIdx])}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Student and graduate accounts ──────────────────────────── */}
      <section className="border-t border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Student and graduate accounts
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Accounts designed around student and graduate life
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {studentAccounts.map((acc) => (
              <div
                key={acc.name}
                className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] shrink-0">
                    <ContentIcon src={acc.icon} size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold">{acc.name}</h3>
                      {acc.tag && (
                        <span className="rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary">
                          {acc.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                      {acc.description}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 mb-5 ml-16">
                  {acc.features.map((f) => (
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

                <div className="ml-16">
                  <Link
                    href={acc.href}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:brightness-105 transition"
                  >
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Accounts for under 18s ────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Accounts for under 18s
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Help young people learn to manage their money
          </p>

          <div className="grid lg:grid-cols-[1fr,auto] gap-8 items-start">
            <div className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] shrink-0">
                  <ContentIcon src={under18Account.icon} size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold">
                      {under18Account.name}
                    </h3>
                    {under18Account.tag && (
                      <span className="rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary">
                        {under18Account.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {under18Account.description}
                  </p>
                </div>
              </div>

              <ul className="space-y-2 mb-5 ml-16">
                {under18Account.features.map((f) => (
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

              <div className="ml-16">
                <Link
                  href={under18Account.href}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:brightness-105 transition"
                >
                  Learn more
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <div className="hidden lg:block relative rounded-2xl overflow-hidden">
              <Image
                src="/images/sections/children.jpg"
                alt="Young person banking"
                width={320}
                height={400}
                className="rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── More accounts (Basic) ─────────────────────────────────── */}
      <section className="border-t border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            More accounts
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Other account options to suit your circumstances
          </p>

          <div className="max-w-2xl">
            <div className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] shrink-0">
                  <ContentIcon src={basicAccount.icon} size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold">{basicAccount.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {basicAccount.description}
                  </p>
                </div>
              </div>

              <ul className="space-y-2 mb-5 ml-16">
                {basicAccount.features.map((f) => (
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

              <div className="ml-16">
                <Link
                  href={basicAccount.href}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:brightness-105 transition"
                >
                  Apply now
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Download the app CTA ──────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="relative flex justify-center">
              <Image
                src="/images/sections/app-screenshot.webp"
                alt="NexusBank mobile app"
                width={280}
                height={560}
                className="rounded-3xl shadow-2xl"
              />
            </div>
            <div className="text-center lg:text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mx-auto lg:mx-0 mb-4">
                <ContentIcon
                  src="/images/icons/device-phone-mobile.svg"
                  size={22}
                />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-3">
                Open a NexusBank Current Account
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-6">
                Download the app and begin your application. T&amp;Cs and
                eligibility apply. 18+ and UK only.
              </p>
              <div className="flex items-center justify-center lg:justify-start gap-4">
                <Link href="#">
                  <Image
                    src="/apple-store.svg"
                    alt="Download on the App Store"
                    width={120}
                    height={40}
                  />
                </Link>
                <Link href="#">
                  <Image
                    src="/google-play.svg"
                    alt="Get it on Google Play"
                    width={135}
                    height={40}
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Important information ──────────────────────────────────── */}
      <section className="border-t border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-8 lg:py-10">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h3 className="text-sm font-bold mb-4">Important information</h3>
          <ol className="space-y-2">
            {footnotes.map((note, i) => (
              <li
                key={i}
                className="text-[10px] text-muted-foreground/60 leading-relaxed"
              >
                <span className="font-bold mr-1">{i + 1}.</span>
                {note}
              </li>
            ))}
          </ol>
          <p className="mt-6 text-[10px] text-muted-foreground/40">
            NexusBank UK PLC is authorised by the Prudential Regulation
            Authority and regulated by the Financial Conduct Authority and the
            Prudential Regulation Authority. Registered office: 1 Nexus Square,
            London, EC2A 1BB.
          </p>
        </div>
      </section>
    </>
  );
}
