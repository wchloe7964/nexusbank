import type { Metadata } from "next";
import Link from "next/link";
import { ContentIcon } from "@/components/shared/content-icon";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers | NexusBank",
  description:
    "Join NexusBank. Explore career opportunities in technology, finance, customer service and more. Build your future with us.",
};

/* ── data ──────────────────────────────────────────────────────────── */

const highlights = [
  {
    icon: "/images/icons/user-group.svg",
    title: "30,000+ colleagues",
    desc: "A diverse and inclusive workforce",
  },
  {
    icon: "/images/icons/academic-cap.svg",
    title: "Learning & development",
    desc: "Funded qualifications and training",
  },
  {
    icon: "/images/icons/heart.svg",
    title: "Wellbeing support",
    desc: "Mental health, healthcare and more",
  },
  {
    icon: "/images/icons/hand-thumb-up.svg",
    title: "Award-winning",
    desc: "Top 10 UK employer three years running",
  },
];

const departments = [
  {
    name: "Technology & Engineering",
    tag: "Hiring",
    description:
      "Build the platforms and products that power banking for millions. Join our engineering, data, cyber security, and cloud teams.",
    features: [
      "Software engineering (full-stack, backend, mobile)",
      "Data engineering and data science",
      "Cloud infrastructure and DevOps",
      "Cyber security and fraud prevention",
      "Product and UX design",
      "AI and machine learning",
    ],
    href: "/careers",
  },
  {
    name: "Customer Service",
    tag: "Hiring",
    description:
      "Be the voice of NexusBank. Help customers over the phone, via chat, or in branch with their everyday banking needs.",
    features: [
      "Contact centre roles (phone and chat)",
      "Branch customer service advisers",
      "Complaints resolution specialists",
      "Fraud operations analysts",
      "Premier relationship managers",
      "Training provided from day one",
    ],
    href: "/careers",
  },
  {
    name: "Finance & Risk",
    tag: null,
    description:
      "Help us manage risk, meet regulatory requirements, and make sound financial decisions that protect our customers and the bank.",
    features: [
      "Financial planning and analysis",
      "Credit risk and modelling",
      "Regulatory compliance",
      "Internal audit",
      "Treasury and capital markets",
      "Operational risk management",
    ],
    href: "/careers",
  },
  {
    name: "Marketing & Communications",
    tag: null,
    description:
      "Shape how NexusBank communicates with customers and the world. Join our brand, digital marketing, PR, and content teams.",
    features: [
      "Brand strategy and design",
      "Digital marketing and SEO/PPC",
      "Social media management",
      "Content writing and copywriting",
      "Public relations and media",
      "Customer insight and research",
    ],
    href: "/careers",
  },
];

const perks = [
  {
    icon: "/images/icons/currency-pound.svg",
    title: "Competitive salary",
    desc: "Market-rate pay reviewed annually, plus a performance bonus scheme.",
  },
  {
    icon: "/images/icons/home.svg",
    title: "Flexible working",
    desc: "Hybrid working with a minimum of two office days per week for most roles.",
  },
  {
    icon: "/images/icons/heart.svg",
    title: "Healthcare",
    desc: "Private medical insurance, dental cover, and an employee assistance programme.",
  },
  {
    icon: "/images/icons/academic-cap.svg",
    title: "Learning budget",
    desc: "\u00a31,000 annual learning budget for courses, conferences and books.",
  },
  {
    icon: "/images/icons/banknotes.svg",
    title: "Pension",
    desc: "Employer pension contributions of up to 12% of your salary.",
  },
  {
    icon: "/images/icons/sparkles.svg",
    title: "Staff discounts",
    desc: "Preferential rates on mortgages, loans, savings and insurance.",
  },
];

/* ── page ──────────────────────────────────────────────────────────── */

export default function CareersPage() {
  return (
    <>
      {/* ── Dark gradient hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1a3e] via-[#102a5c] to-[#0e2350]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,174,239,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-14 lg:py-20 relative">
          <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
            Careers at NexusBank
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white max-w-2xl leading-tight">
            Build your career with a bank that matters
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 leading-relaxed">
            Join 30,000 colleagues making a real difference to millions of customers
            every day. We invest in your growth, wellbeing, and future.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
            >
              View open roles
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:bg-white/5 transition"
            >
              About NexusBank
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

      {/* ── Departments ─────────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Explore our teams
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Find the department that matches your skills and ambitions
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {departments.map((d) => (
              <div
                key={d.name}
                className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold">{d.name}</h3>
                  {d.tag && (
                    <span className="rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-semibold text-primary">
                      {d.tag}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  {d.description}
                </p>
                <ul className="space-y-2.5 mb-6">
                  {d.features.map((f) => (
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
                  href={d.href}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:brightness-105 transition"
                >
                  View roles
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Perks ───────────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-[#f8f8f8] dark:bg-muted/20 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Benefits &amp; perks
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            What you get when you work at NexusBank
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {perks.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-border bg-white dark:bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mb-4">
                  <ContentIcon src={p.icon} size={22} />
                </div>
                <h3 className="text-sm font-bold">{p.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/[0.07] mx-auto mb-4">
            <ContentIcon src="/images/icons/briefcase.svg" size={22} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Ready to make your move?
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
            Browse our current openings and find a role that excites you. We welcome
            applications from everyone, regardless of background.
          </p>
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 rounded-full bg-[#00aeef] px-7 py-3 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,174,239,0.3)] hover:brightness-110 transition"
          >
            Search open roles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
