import Link from 'next/link'

export function RegulatoryFooter() {
  return (
    <footer className="mt-10 border-t border-border/40 pt-6 pb-4">
      {/* Links */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <Link href="/complaints" className="text-primary hover:underline">
          Contact Us
        </Link>
        <span className="text-border">|</span>
        <Link href="/privacy" className="text-primary hover:underline">
          Security
        </Link>
        <span className="text-border">|</span>
        <Link href="/accessibility" className="text-primary hover:underline">
          Accessibility
        </Link>
      </div>

      {/* Regulatory text */}
      <div className="mt-5 space-y-3 text-[10px] leading-relaxed text-muted-foreground/50">
        <p>
          NexusBank is a trading name of NexusBank UK PLC and NexusBank Bank UK PLC. NexusBank UK PLC.
          Authorised by the Prudential Regulation Authority and regulated by the Financial Conduct Authority and the
          Prudential Regulation Authority (Financial Services Register number: 759676). Registered in England.
          Registered No. 9740322. Registered Office: 1 Churchill Place, London E14 5HP. NexusBank Bank UK PLC.
          Authorised by the Prudential Regulation Authority and regulated by the Financial Conduct Authority and the
          Prudential Regulation Authority (Financial Services Register number: 759676). Registered in England.
          Registered No. 9740322. Registered Office: 1 Churchill Place, London E14 5HP.
        </p>
        <p>
          If you&apos;re not happy with our service, we&apos;d like the opportunity to put things right.
          Find out how to{' '}
          <Link href="/complaints" className="text-primary hover:underline">
            complain
          </Link>
          , and learn more about the{' '}
          <Link href="/complaints" className="text-primary hover:underline">
            Financial Ombudsman Service
          </Link>
          .
        </p>
        <p>
          For more information about NexusBank, please visit our{' '}
          <Link href="/" className="text-primary hover:underline">
            website
          </Link>
          .
        </p>
        <p>
          NexusBank offers mortgage products. YOUR HOME MAY BE REPOSSESSED IF YOU DO NOT KEEP UP
          REPAYMENTS ON YOUR MORTGAGE. NexusBank acts as a broker and not a lender in the distribution of
          Consumer (Regulated) insurance products. In doing so, NexusBank is registered as an Appointed
          Representative of NexusBank Insurance Services Company Limited.
        </p>
      </div>
    </footer>
  )
}
