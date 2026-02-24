import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/brand/logo";
import { TrustBadges } from "@/components/brand/trust-badges";
import { Search, ChevronDown, Menu, ArrowRight } from "lucide-react";

/* ── Shared navigation data (matches page.tsx) ─────────────────────── */

const navCategories: {
  label: string;
  href: string;
  groups: { heading: string; items: string[] }[];
}[] = [
  {
    label: "Accounts",
    href: "/current-accounts",
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
    href: "/mortgages",
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
    href: "/loans",
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
    href: "/credit-cards",
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
    href: "/savings",
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
    href: "/investments",
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
    href: "/insurance",
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
    href: "/ways-to-bank",
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

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-background">
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
            {navCategories.map((cat) => (
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
                            href={cat.href}
                            className="block px-4 py-1.5 text-sm text-muted-foreground hover:text-primary hover:bg-[#f2f2f2] dark:hover:bg-muted transition-colors">
                            {item}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
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

      {/* ── Page content ───────────────────────────────────────────────── */}
      <main>{children}</main>

      {/* ── Return to top ──────────────────────────────────────────────── */}
      <div className="border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-4 text-center">
          <a
            href="#"
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
