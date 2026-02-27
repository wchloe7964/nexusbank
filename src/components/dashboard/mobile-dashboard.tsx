"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { formatGBP } from "@/lib/utils/currency";
import { formatTransactionDate } from "@/lib/utils/dates";
import { transactionCategories } from "@/lib/constants/categories";
import { KycBanner } from "@/components/shared/kyc-banner";
import type { KycProfileStatus } from "@/lib/types";
import {
  CreditCard,
  Gift,
  PieChart,
  Smartphone,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Lightbulb,
} from "lucide-react";

interface AccountSummary {
  id: string;
  account_name: string;
  account_type: string;
  balance: number;
  available_balance: number;
  sort_code?: string;
  account_number?: string;
  is_active?: boolean;
  status?: string;
}

interface MobileDashboardProps {
  kycStatus: KycProfileStatus;
  primaryAccount: AccountSummary | null;
  totalBalance: number;
  accountCount: number;
  hiddenCount: number;
  accounts: AccountSummary[];
  recentTransactions: Array<{
    id: string;
    description: string;
    counterparty_name: string | null;
    category: string;
    amount: number;
    type: string;
    transaction_date: string;
  }>;
}

const quickActions = [
  { href: "/cards", icon: CreditCard, label: "Your cards" },
  { href: "/rewards", icon: Gift, label: "Your rewards" },
  { href: "/transactions", icon: PieChart, label: "Spending" },
  { href: "/settings", icon: Smartphone, label: "Mobile PINsentry" },
];

const typeLabels: Record<string, string> = {
  current: "Current",
  savings: "Savings",
  isa: "ISA",
  business: "Business",
};

export function MobileDashboard({
  kycStatus,
  primaryAccount,
  totalBalance,
  accountCount,
  hiddenCount,
  accounts,
  recentTransactions,
}: MobileDashboardProps) {
  const [promoVisible, setPromoVisible] = useState(true);

  // Other accounts (excluding primary)
  const otherAccounts = accounts.filter(
    (a) => a.id !== primaryAccount?.id,
  );

  return (
    <div className="-m-6 min-h-screen bg-[#f7f5f4] dark:bg-background lg:hidden">
      {/* ── Account Hero (flat white section, not a card) ── */}
      <div className="bg-white dark:bg-card">
        <Link
          href={
            primaryAccount ? `/accounts/${primaryAccount.id}` : "/accounts"
          }>
          <div className="flex items-center px-6 pt-5 pb-5">
            <div className="flex-1 flex flex-col items-center">
              <LogoMark size="md" />

              <p className="mt-0 text-[18px] font-normal text-[#0676b6] tracking-wide">
                Nexus Bank A/C
              </p>

              <p className="mt-0 text-[20px] tracking-tight text-[#0676b6]">
                {formatGBP(
                  primaryAccount ? primaryAccount.balance : totalBalance,
                )}
              </p>

              <p className="mt-1 text-[11px] text-muted-foreground">
                Available balance
                {primaryAccount?.sort_code && primaryAccount?.account_number
                  ? ` | ${primaryAccount.sort_code} ${primaryAccount.account_number}`
                  : ""}
              </p>
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground/40 shrink-0" />
          </div>
        </Link>

        {/* Other accounts — same hero style as primary */}
        {otherAccounts.map((account) => {
          const isRestricted =
            account.is_active === false ||
            (account.status && account.status !== "active");
          return (
            <div key={account.id}>
              <div className="mx-6 h-px bg-border/40" />
              <Link href={`/accounts/${account.id}`}>
                <div
                  className={`flex items-center px-6 pt-4 pb-4 ${
                    isRestricted ? "opacity-50" : ""
                  }`}>
                  <div className="flex-1 flex flex-col items-center">
                    <LogoMark size="sm" />

                    <p className="mt-0 text-[16px] font-normal text-[#0676b6] tracking-wide">
                      {account.account_name}
                    </p>

                    <p className="mt-0 text-[18px] tracking-tight text-[#0676b6]">
                      {formatGBP(account.balance)}
                    </p>

                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Available balance
                      {account.sort_code && account.account_number
                        ? ` | ${account.sort_code} ${account.account_number}`
                        : ""}
                      {isRestricted && (
                        <span className="text-destructive ml-1">
                          &middot;{" "}
                          {account.status === "frozen"
                            ? "Frozen"
                            : account.status === "closed"
                              ? "Closed"
                              : "Restricted"}
                        </span>
                      )}
                    </p>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                </div>
              </Link>
            </div>
          );
        })}

        {/* Hidden accounts hint */}
        {hiddenCount > 0 && (
          <>
            <div className="mx-6 h-px bg-border/40" />
            <Link href="/accounts" className="block">
              <p className="py-3.5 text-center text-[13px] text-muted-foreground">
                You&apos;ve hidden{" "}
                <span className="font-medium">
                  {hiddenCount} account{hiddenCount !== 1 ? "s" : ""}
                </span>
              </p>
            </Link>
          </>
        )}
      </div>

      {/* ── Content on gray background ──────────────────── */}
      <div className="px-4 pt-4 pb-8 space-y-4">
        {/* ── KYC Banner (mobile) ─────────────────────────── */}
        {kycStatus !== "verified" && (
          <KycBanner status={kycStatus} variant="mobile" />
        )}

        {/* ── Promotional Banner ───────────────────────────── */}
        {promoVisible && (
          <div className="rounded-2xl bg-white dark:bg-card overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-foreground leading-snug">
                  Reach your financial goals
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
                  Explore our budgeting tools, savings calculators, and spending
                  insights to stay in control.
                </p>
              </div>
              <button
                onClick={() => setPromoVisible(false)}
                className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Quick Actions ────────────────────────────────── */}
        <div className="flex justify-around px-2">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <div className="flex flex-col items-center gap-2 py-1 w-[72px]">
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#0676b6] shadow-[0_2px_8px_rgba(6,118,182,0.25)]">
                  <action.icon
                    className="h-[22px] w-[22px] text-white"
                    strokeWidth={1.0}
                  />
                </div>
                <span className="text-[10px] font-medium text-[#0676b6] text-center leading-tight">
                  {action.label}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Tips & Tools Card (light card with illustration area) ── */}
        <Link href="/tools">
          <div className="rounded-2xl bg-white dark:bg-card overflow-hidden">
            <div className="bg-gradient-to-br from-[#e8f8ff] to-[#f0f4ff] dark:from-[#0676b6]/20 dark:to-[#0676b6]/10 px-5 py-6 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0676b6]/15">
                  <Lightbulb
                    className="h-6 w-6 text-[#0676b6]"
                    strokeWidth={1.0}
                  />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0676b6]">
                    Tips &amp; Tools
                  </p>
                  <p className="text-[13px] font-bold text-foreground mt-0.5">
                    Manage your money better
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Our tools and tips could help you manage rising living costs.
              </p>
            </div>
          </div>
        </Link>

        {/* ── Recent Transactions ──────────────────────────── */}
        {recentTransactions.length > 0 && (
          <div>
            <div className="mt-3 mb-3 flex items-center justify-between px-1">
              <h2 className="text-[14px] font-semibold text-foreground">
                Recent transactions
              </h2>
              <Link
                href="/transactions"
                className="text-[12px] font-medium text-[#0676b6]">
                View all
              </Link>
            </div>
            <div className="rounded-2xl bg-white dark:bg-card overflow-hidden">
              {recentTransactions.map((tx) => {
                const cat =
                  transactionCategories[
                    tx.category as keyof typeof transactionCategories
                  ];
                const Icon = cat?.icon;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-full ${cat?.bg ?? "bg-gray-50 dark:bg-gray-950"}`}>
                        {Icon && (
                          <Icon
                            className={`h-[17px] w-[17px] ${cat?.color ?? "text-gray-500"}`}
                            strokeWidth={1.0}
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">
                          {tx.description}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {tx.counterparty_name
                            ? `${tx.counterparty_name} · `
                            : ""}
                          {formatTransactionDate(tx.transaction_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      {tx.type === "credit" ? (
                        <ArrowDownLeft className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                      )}
                      <p
                        className={`text-[13px] font-semibold tabular-nums ${
                          tx.type === "credit"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                        }`}>
                        {tx.type === "credit" ? "+" : "-"}
                        {formatGBP(Number(tx.amount))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
