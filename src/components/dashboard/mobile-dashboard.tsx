"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/brand/logo";
import { formatGBP } from "@/lib/utils/currency";
import { formatTransactionDate } from "@/lib/utils/dates";
import { transactionCategories } from "@/lib/constants/categories";
import {
  CreditCard,
  Gift,
  PieChart,
  Smartphone,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
} from "lucide-react";

interface MobileDashboardProps {
  primaryAccount: {
    id: string;
    account_name: string;
    account_type: string;
    balance: number;
    available_balance: number;
    sort_code?: string;
    account_number?: string;
  } | null;
  totalBalance: number;
  accountCount: number;
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
  { href: "/accounts", icon: Gift, label: "Your rewards" },
  { href: "/transactions", icon: PieChart, label: "Spending" },
  { href: "/settings/security", icon: Smartphone, label: "Mobile\nPINsentry" },
];

export function MobileDashboard({
  primaryAccount,
  totalBalance,
  accountCount,
  recentTransactions,
}: MobileDashboardProps) {
  const [promoVisible, setPromoVisible] = useState(true);

  return (
    <div className="space-y-5 lg:hidden">
      {/* Account Hero */}
      <Card className="border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <CardContent className="p-5">
          <div className="flex flex-col items-center text-center">
            <LogoMark size="md" />

            <h2 className="mt-3 text-sm font-semibold text-primary">
              {"Nexus Bank A/C"}
            </h2>
            <p className="mt-1 text-3xl font-bold tracking-tight">
              {formatGBP(
                primaryAccount ? primaryAccount.balance : totalBalance,
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Available balance
              {primaryAccount?.sort_code && primaryAccount?.account_number
                ? ` | ${primaryAccount.sort_code} ${primaryAccount.account_number}`
                : ""}
            </p>

            {accountCount > 1 && (
              <Link
                href="/accounts"
                className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                View {accountCount - 1} more account
                {accountCount - 1 > 1 ? "s" : ""}
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Promotional Banner */}
      {promoVisible && (
        <Card className="border-0 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  Tools and tips to manage your money
                </p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Explore our budgeting tools, savings calculators, and spending
                  insights to help you stay in control of your finances.
                </p>
              </div>
              <button
                onClick={() => setPromoVisible(false)}
                className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <div className="flex flex-col items-center gap-1.5 py-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight whitespace-pre-line">
                {action.label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent Transactions</h2>
          <Link
            href="/transactions"
            className="text-xs font-medium text-primary">
            View all
          </Link>
        </div>
        <Card className="border-0 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <CardContent className="p-0">
            {recentTransactions.length > 0 ? (
              <div className="divide-y divide-border">
                {recentTransactions.map((tx) => {
                  const cat =
                    transactionCategories[
                      tx.category as keyof typeof transactionCategories
                    ];
                  const Icon = cat?.icon;
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-full p-2 ${cat?.bg ?? "bg-gray-50 dark:bg-gray-950"}`}>
                          {Icon && (
                            <Icon
                              className={`h-4 w-4 ${cat?.color ?? "text-gray-500"}`}
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
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
                      <div className="flex items-center gap-1.5">
                        {tx.type === "credit" ? (
                          <ArrowDownLeft className="h-3 w-3 text-success" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                        )}
                        <p
                          className={`text-sm font-semibold tabular-nums ${tx.type === "credit" ? "text-success" : ""}`}>
                          {tx.type === "credit" ? "+" : "-"}
                          {formatGBP(Number(tx.amount))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground">
                  No recent transactions
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
