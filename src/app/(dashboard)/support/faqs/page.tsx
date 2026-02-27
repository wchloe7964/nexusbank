'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface FAQ {
  question: string
  answer: string
}

interface FAQCategory {
  title: string
  faqs: FAQ[]
}

const faqCategories: FAQCategory[] = [
  {
    title: 'Accounts',
    faqs: [
      {
        question: 'How do I open a new account?',
        answer:
          'You can open a new account by navigating to the Accounts page and clicking "Open New Account". Follow the on-screen steps to choose your account type and complete the application. Most accounts are opened instantly.',
      },
      {
        question: 'What types of accounts are available?',
        answer:
          'We offer Current Accounts for everyday banking, Savings Accounts for growing your money, ISAs for tax-free savings, and Business Accounts for commercial use. Each account type has different features and benefits.',
      },
      {
        question: 'How do I close my account?',
        answer:
          'To close an account, please contact our support team via the Messages section or call us. You will need to ensure the account has a zero balance and no pending transactions before closure.',
      },
      {
        question: 'What happens if my account is frozen?',
        answer:
          'If your account has been frozen, you will not be able to make transfers or payments from it. A frozen account banner will appear on your account page. Please contact our support team for assistance with unfreezing your account.',
      },
    ],
  },
  {
    title: 'Transfers & Payments',
    faqs: [
      {
        question: 'How long do transfers take?',
        answer:
          'Transfers between your own Nexus Bank accounts are instant. Faster Payments to other UK banks typically arrive within 2 hours but can take up to 24 hours. International transfers usually take 1-5 business days depending on the destination.',
      },
      {
        question: 'What is my transfer PIN?',
        answer:
          'Your transfer PIN is a 4-digit code used to authorise transfers and payments. You will be asked to set one up when you make your first transfer. You can reset it in Settings if you forget it.',
      },
      {
        question: 'Is there a transfer limit?',
        answer:
          'Daily transfer limits depend on your account type. Current accounts have a default limit of \u00a325,000 per day. You can request a limit increase by contacting our support team.',
      },
      {
        question: 'How do I set up a standing order?',
        answer:
          'Go to Payments, click "New Payment", and select "Standing Order". Enter the payee details, amount, and frequency. Standing orders can be managed or cancelled from the Payments page.',
      },
    ],
  },
  {
    title: 'Cards',
    faqs: [
      {
        question: 'How do I freeze my card?',
        answer:
          'You can freeze your debit or credit card instantly from the Cards page. Tap on the card and use the Freeze option. You can unfreeze it at any time from the same page.',
      },
      {
        question: 'What should I do if my card is lost or stolen?',
        answer:
          'Freeze your card immediately from the Cards page to prevent unauthorised use. Then contact us via the Help section or call our 24/7 hotline. We will cancel the card and send a replacement.',
      },
      {
        question: 'How do I activate a new card?',
        answer:
          'When you receive a new card, go to the Cards page and select "Activate Card". You will need to enter the last 4 digits of your card number and set a new PIN.',
      },
    ],
  },
  {
    title: 'Security',
    faqs: [
      {
        question: 'How do I change my password?',
        answer:
          'Go to Settings and select "Security". Click "Change Password" and follow the steps. You will need to enter your current password and choose a new one that meets our security requirements.',
      },
      {
        question: 'What is two-factor authentication?',
        answer:
          'Two-factor authentication (2FA) adds an extra layer of security to your account. When enabled, you will need to enter a verification code sent to your phone in addition to your password when logging in.',
      },
      {
        question: 'How do I report suspicious activity?',
        answer:
          'If you notice any suspicious transactions or activity on your account, go to Help > Report a Problem or contact us immediately. Do not share your banking details with anyone who contacts you unexpectedly.',
      },
    ],
  },
  {
    title: 'Products & Services',
    faqs: [
      {
        question: 'How do I apply for a loan?',
        answer:
          'Navigate to Products > Loans to view available loan options. You can check your eligibility and apply online. Most decisions are made instantly, and funds are usually available within 24 hours of approval.',
      },
      {
        question: 'How do savings goals work?',
        answer:
          'Savings Goals let you set a target amount and track your progress. Go to Products > Savings Goals to create one. You can set up automatic contributions and monitor how close you are to reaching each goal.',
      },
      {
        question: 'What rewards can I earn?',
        answer:
          'Nexus Bank Rewards lets you earn points on qualifying transactions. Points can be redeemed for cashback, gift cards, or donations. Visit the Rewards page to see your balance and available offers.',
      },
    ],
  },
]

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false)

  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left px-5 py-4 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{faq.question}</p>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 mt-0.5',
            open && 'rotate-180',
          )}
        />
      </div>
      {open && (
        <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed pr-6">
          {faq.answer}
        </p>
      )}
    </button>
  )
}

export default function FAQsPage() {
  const [search, setSearch] = useState('')

  const filteredCategories = faqCategories
    .map((cat) => ({
      ...cat,
      faqs: cat.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(search.toLowerCase()) ||
          faq.answer.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((cat) => cat.faqs.length > 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="FAQs"
        description="Find answers to frequently asked questions"
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search FAQs..."
          className="pl-10 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* FAQ Categories */}
      {filteredCategories.length > 0 ? (
        <div className="space-y-6">
          {filteredCategories.map((category) => (
            <div key={category.title}>
              <h2 className="text-sm font-semibold text-foreground mb-2 px-1">
                {category.title}
              </h2>
              <Card variant="raised">
                <CardContent className="p-0 divide-y divide-border/40">
                  {category.faqs.map((faq) => (
                    <FAQItem key={faq.question} faq={faq} />
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-5 lg:p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No results found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different search term or browse all categories.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
