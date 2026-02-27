import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageSquare,
  Phone,
  Mail,
  FileText,
  Shield,
  CreditCard,
  HelpCircle,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const helpCategories = [
  {
    label: "FAQs",
    description: "Find answers to common questions",
    href: "/support/faqs",
    icon: HelpCircle,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    label: "Contact Us",
    description: "Speak with our support team",
    href: "/messages",
    icon: MessageSquare,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    label: "Report a Problem",
    description: "Report fraud, disputes or issues",
    href: "/disputes",
    icon: Shield,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
  },
  {
    label: "Make a Complaint",
    description: "Submit a formal complaint",
    href: "/my-complaints",
    icon: FileText,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    label: "Lost or Stolen Card",
    description: "Block or freeze your cards",
    href: "/cards",
    icon: CreditCard,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
  },
];

const contactMethods = [
  {
    label: "Whatsapp",
    detail: "+44 7365 192524",
    sublabel: "Mon–Fri 8am–8pm, Sat 9am–5pm",
    icon: Phone,
  },
  {
    label: "Email us",
    detail: "support@nexusbankuk.com",
    sublabel: "We aim to respond within 24 hours",
    icon: Mail,
  },
  {
    label: "Live chat",
    detail: "Start a conversation",
    sublabel: "Available 24/7",
    icon: MessageSquare,
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Help & Support"
        description="How can we help you today?"
      />

      <div className="space-y-3">
        {helpCategories.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card variant="raised" interactive>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`shrink-0 rounded-xl p-3 ${item.bg}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Contact Methods */}
      <div>
        <h2 className="text-base font-semibold mb-3">Get in touch</h2>
        <Card variant="raised">
          <CardContent className="p-0 divide-y divide-border/60">
            {contactMethods.map((method) => (
              <div
                key={method.label}
                className="flex items-center gap-4 px-5 py-4">
                <div className="shrink-0 rounded-xl bg-muted p-2.5">
                  <method.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{method.label}</p>
                  <p className="text-xs text-primary font-medium mt-0.5">
                    {method.detail}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {method.sublabel}
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
