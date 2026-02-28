# NexusBank

A full-featured, production-grade digital banking platform built with Next.js 16, React 19, and Supabase. NexusBank delivers a complete retail banking experience with customer-facing dashboards, admin operations, regulatory compliance, and multi-product financial services.

**Live:** [https://nexusbankuk.com](https://nexusbankuk.com)

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Features](#features)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [Authentication & Security](#authentication--security)
- [Email Templates](#email-templates)
- [Deployment](#deployment)
- [Process Management](#process-management)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Scripts](#scripts)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.1.6 (App Router) |
| **UI** | React 19.2.3, TypeScript 5 |
| **Styling** | Tailwind CSS 4, PostCSS |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth (email/password + 2FA) |
| **Validation** | Zod 4 |
| **Charts** | Recharts 3.7 |
| **Icons** | Lucide React |
| **Date Handling** | date-fns 4 |
| **Theme** | next-themes (light/dark/system) |
| **Process Manager** | PM2 |
| **Web Server** | Nginx (via aaPanel) |
| **DNS/CDN** | Cloudflare |

---

## Architecture

```
Client (Browser)
    |
Cloudflare (DNS + CDN)
    |
Nginx (Reverse Proxy, SSL Termination)
    |
Next.js 16 (Port 3001)
    |--- App Router (Pages + API Routes)
    |--- Middleware (Session + Auth Guards)
    |--- Server Components + Server Actions
    |
Supabase (PostgreSQL + Auth + RLS)
```

### Key Architectural Decisions

- **App Router** with server/client component separation
- **Supabase SSR** for server-side session management via cookies
- **Row-Level Security (RLS)** on all database tables
- **Integer-based money arithmetic** (pence) to avoid floating-point drift
- **Middleware-based auth** with role-based route protection
- **PCI-DSS compliance** via card tokenization (never store raw card numbers)

---

## Project Structure

```
nexusbank/
|-- src/
|   |-- app/                    # Next.js App Router
|   |   |-- (auth)/             # Auth pages (login, register, forgot-password)
|   |   |-- (dashboard)/        # Customer dashboard (accounts, transfers, etc.)
|   |   |-- (admin)/            # Admin panel (customers, compliance, fraud)
|   |   |-- (marketing)/        # Public marketing pages
|   |   |-- (legal)/            # Legal pages (privacy, terms, cookies)
|   |   |-- api/                # API routes
|   |   |-- layout.tsx          # Root layout
|   |   |-- error.tsx           # Global error boundary
|   |   |-- not-found.tsx       # 404 page
|   |   |-- robots.ts           # SEO robots.txt
|   |   +-- sitemap.ts          # SEO sitemap.xml
|   |
|   |-- components/
|   |   |-- ui/                 # Base UI components (button, card, dialog, input)
|   |   |-- layout/             # Sidebar, topbar, mobile nav, bottom nav
|   |   |-- admin/              # Admin sidebar, topbar, data table, stat card
|   |   |-- auth/               # Regulatory footer
|   |   |-- brand/              # Logo, trust badges
|   |   |-- shared/             # Bank card, cookie consent, session timeout, etc.
|   |   |-- dashboard/          # Mobile dashboard layout
|   |   +-- two-factor/         # 2FA setup/disable dialogs
|   |
|   |-- lib/
|   |   |-- supabase/           # Supabase clients (browser, server, admin, middleware)
|   |   |-- queries/            # 37+ database query modules
|   |   |-- types/              # TypeScript type definitions
|   |   |-- constants/          # Navigation, categories, countries, product configs
|   |   |-- utils/              # Currency, dates, sort codes, classnames
|   |   |-- kyc/                # KYC verification + AML monitoring
|   |   |-- fraud/              # Fraud scoring engine
|   |   |-- payments/           # IBAN validation, modulus check, payment rails, FX
|   |   |-- limits/             # Transaction limits + cooling periods
|   |   |-- pci/                # Card tokenization + PCI access logging
|   |   |-- pin/                # Transfer PIN service
|   |   |-- finance/            # Interest calculation engine
|   |   |-- regulatory/         # FCA complaint handling, suitability checks
|   |   |-- notifications/      # Email template rendering + sending
|   |   |-- validation.ts       # Zod schemas, amount validation, auth checks
|   |   +-- audit.ts            # Audit event logging
|   |
|   +-- emails/                 # HTML email templates (6 templates)
|
|-- public/
|   +-- images/                 # Logos, icons, section images
|
|-- supabase/
|   |-- migrations/             # 36 SQL migration files
|   +-- seed.sql                # Initial seed data
|
|-- deploy/
|   |-- setup-daemon.sh         # PM2 daemon + watchdog setup
|   |-- watchdog.sh             # Cron health-check script
|   +-- nexusbank.service       # systemd service file (alternative)
|
|-- ecosystem.config.js         # PM2 configuration
|-- middleware.ts               # Next.js middleware (auth + session)
|-- next.config.ts              # Security headers, CSP
|-- deploy.sh                   # Full VPS deployment script
+-- .env.local                  # Environment variables (not tracked)
```

---

## Features

### Customer Banking

- **Accounts** -- Current, savings, ISA account management with real-time balances
- **Transfers** -- Domestic (Faster Payments) and international (SWIFT/SEPA/TARGET2) transfers
- **Payments** -- Standing orders, direct debits, payment calendar
- **Cards** -- Debit and credit card management with spending limits
- **Payees** -- Payee directory with Confirmation of Payee (CoP) name matching
- **Transactions** -- Full history with search, filtering, CSV export
- **Statements** -- Downloadable account statements

### Financial Products

- **Credit Cards** -- Multiple card products with credit limits and APR
- **Loans** -- Personal, mortgage, auto, and student loans
- **Investments** -- ISA, pension, and general investment accounts
- **Insurance** -- Home, car, life, travel, health, and pet insurance
- **Rewards** -- Cashback program with merchant-specific rates
- **Savings Goals** -- Goal tracking with progress visualisation

### Analytics & Tools

- **Spending Insights** -- Category breakdown charts, merchant analysis
- **Budgets** -- Monthly budget planning with category allocation
- **Subscription Detection** -- Automatic recurring payment identification
- **Financial Calculators** -- Mortgage, loan, savings, and budget planner tools
- **Spending Forecasts** -- Predictive analytics based on historical patterns

### Admin Panel

- **Customer Management** -- View, search, and manage customer accounts
- **Transaction Monitoring** -- Real-time transaction oversight
- **KYC Verification** -- Identity verification workflow and approval
- **AML Monitoring** -- Anti-money laundering screening and alerts
- **Fraud Detection** -- Rule-based scoring engine with case management
- **Compliance Dashboard** -- Regulatory reporting and audit trails
- **Manual Credits/Debits** -- Administrative balance adjustments
- **Interest Rate Management** -- Configure rates across account types
- **Transaction Limits** -- Set and manage velocity/daily/monthly limits
- **Dispute Resolution** -- Customer dispute handling workflow
- **Complaint Handling** -- FCA DISP-compliant complaint management
- **Subject Access Requests** -- GDPR SAR processing
- **PCI-DSS Compliance** -- Tokenization audit and access logs

### Communication

- **Secure Messaging** -- Encrypted bank-to-customer messaging
- **Email Notifications** -- Templated emails for transactions, security alerts, OTP, etc.
- **Notification Centre** -- In-app notification management
- **Spending Alerts** -- Configurable threshold-based alerts

### Open Banking (PSD2)

- **AISP** -- Account Information Service Provider endpoints
- **Third-Party Consent** -- Provider management and consent lifecycle
- **Transaction Export** -- Standardised transaction data API

---

## Database Schema

The database consists of 36 migrations building the following core tables:

### Core Tables

| Table | Description |
|-------|------------|
| `profiles` | User profiles (name, DOB, address, preferences, 2FA) |
| `accounts` | Bank accounts (current, savings, ISA) with balances |
| `transactions` | All financial transactions with categories |
| `cards` | Debit cards linked to accounts |
| `payees` | Saved payee directory |
| `scheduled_payments` | Standing orders and direct debits |

### Product Tables

| Table | Description |
|-------|------------|
| `credit_cards` | Credit card accounts with limits and APR |
| `loans` | Loan products (personal, mortgage, auto, student) |
| `investments` | Investment accounts (ISA, pension, general) |
| `insurance_policies` | Insurance policies (home, car, life, travel) |
| `rewards` | Cashback and reward transactions |
| `savings_goals` | User savings goals with progress |
| `budgets` | Monthly budget allocations by category |

### Compliance Tables

| Table | Description |
|-------|------------|
| `kyc_verifications` | Know Your Customer verification records |
| `aml_alerts` | Anti-money laundering screening alerts |
| `fraud_cases` | Fraud detection cases and decisions |
| `fraud_rules` | Configurable fraud detection rules |
| `audit_logs` | Complete audit trail of all actions |
| `disputes` | Customer dispute records |
| `complaints` | FCA-compliant complaint records |
| `pci_access_logs` | PCI-DSS access audit logs |
| `regulatory_reports` | FCA regulatory report submissions |
| `subject_access_requests` | GDPR SAR tracking |

### Communication Tables

| Table | Description |
|-------|------------|
| `conversations` | Secure messaging threads |
| `messages` | Individual messages within conversations |
| `notifications` | In-app notifications |
| `login_activity` | Authentication event logs |

### Key Database Features

- **Row-Level Security (RLS)** on all tables -- users can only access their own data
- **Auto-profile creation** via database trigger on user signup
- **Indexed queries** on account_id, transaction_date, category, transfer_reference
- **Money stored as NUMERIC(19,4)** for precision
- **Sort codes as CHAR(8)** in `XX-XX-XX` format
- **UUID primary keys** across all tables

---

## API Routes

| Route | Method | Description |
|-------|--------|------------|
| `/api/auth/callback` | GET | Supabase OAuth callback handler |
| `/api/address-lookup` | GET | UK postcode lookup (via postcodes.io) |
| `/api/insights` | GET | Spending analytics calculations |
| `/api/messages/[conversationId]` | GET/POST | Secure messaging API |
| `/api/open-banking/v1/accounts` | GET | PSD2 AISP account data |
| `/api/open-banking/v1/transactions` | GET | PSD2 transaction export |
| `/api/statements` | GET | Account statement generation |
| `/api/transactions/export` | GET | Transaction CSV export |

---

## Authentication & Security

### Auth Flow

1. User registers with email/password via Supabase Auth
2. Profile auto-created via database trigger
3. Session managed via HTTP-only cookies (Supabase SSR)
4. Middleware refreshes session on every request
5. Optional 2FA setup via authenticator app
6. Role-based access control: `customer`, `admin`, `super_admin`, `auditor`

### Security Headers (next.config.ts)

- **Content-Security-Policy** -- Restricts script/style/image sources
- **X-Frame-Options: DENY** -- Prevents clickjacking
- **X-Content-Type-Options: nosniff** -- Prevents MIME sniffing
- **Referrer-Policy: strict-origin-when-cross-origin**
- **X-XSS-Protection: 1; mode=block**
- **Permissions-Policy** -- Disables camera, microphone, geolocation; enables payment

### Compliance Systems

- **KYC** -- Identity verification with document upload and risk scoring
- **AML** -- Real-time transaction screening (large amounts, velocity, patterns)
- **Fraud Detection** -- Rule-based scoring engine (0-100 scale) with velocity, geography, and payee checks
- **PCI-DSS** -- Card tokenization, access logging, no raw card data storage
- **Cooling Periods** -- Enforced delays for new payee payments
- **PIN Protection** -- Transfer PIN required for high-value transactions
- **Audit Logging** -- Every action logged with user, timestamp, and metadata

---

## Email Templates

Six HTML email templates located in `src/emails/`:

| Template | Purpose |
|----------|---------|
| `welcome.html` | Account opening welcome email |
| `otp-verification.html` | Two-factor authentication OTP delivery |
| `password-reset.html` | Password reset link |
| `security-alert.html` | Security event notifications (login, device, etc.) |
| `transaction.html` | Transaction confirmation (credit/debit) |
| `notification.html` | General notifications |

### Template Features

- Table-based layouts for maximum email client compatibility
- MSO conditionals for Outlook rendering
- Dark mode support via `prefers-color-scheme`
- Mobile-responsive design
- NexusBank logo in both cyan (light backgrounds) and white (dark backgrounds) variants
- Template variables use `{{variable}}` syntax

---

## Deployment

### Infrastructure

| Component | Details |
|-----------|---------|
| **VPS** | Ubuntu 22.04, 173.46.80.218 |
| **Domain** | nexusbankuk.com |
| **DNS/CDN** | Cloudflare |
| **Panel** | aaPanel (port 25054) |
| **Web Server** | Nginx (via aaPanel) |
| **Node.js** | v22.14.0 (via nvm) |
| **App Port** | 3001 |
| **App Directory** | `/www/wwwroot/nexusbankuk.com/` |
| **Git Remote** | SSH (`git@github.com:wchloe7964/nexusbank.git`) |

### Deploy Updates

```bash
# SSH into VPS
ssh root@173.46.80.218

# Pull latest, build, restart
cd /www/wwwroot/nexusbankuk.com
git pull
npm run build
pm2 restart nexusbank
```

### Full Setup (Fresh VPS)

```bash
bash deploy.sh
bash deploy/setup-daemon.sh
```

### Nginx Configuration

Nginx is managed by aaPanel. Key commands:

```bash
# Test config
/www/server/nginx/sbin/nginx -t

# Reload (NOT systemctl)
/www/server/nginx/sbin/nginx -s reload
```

> **Important:** Always use aaPanel's nginx binary, not `systemctl start nginx`.

---

## Process Management

NexusBank uses a 3-layer uptime protection system:

### Layer 1: PM2 Auto-Restart

Configured via `ecosystem.config.js`:

- **Auto-restart on crash** with 5-second delay
- **Memory limit** of 512MB (restarts if exceeded)
- **Max 50 restarts** with 10-second minimum uptime
- **Graceful shutdown** with SIGINT + 10-second timeout
- **Log rotation** to `logs/pm2-error.log` and `logs/pm2-out.log`

### Layer 2: PM2 Boot Startup

PM2 is registered with systemd to auto-start on server reboot:

```bash
pm2 startup systemd
pm2 save
```

### Layer 3: Watchdog Cron

A health-check script runs every 3 minutes via cron:

- Curls `http://127.0.0.1:3001` to check if app responds
- Retries twice with 5-second delay before declaring failure
- Restarts PM2 process if unresponsive
- Logs all checks to `logs/watchdog.log`

### PM2 Commands

```bash
pm2 status                    # Check process status
pm2 logs nexusbank            # View live logs
pm2 restart nexusbank         # Restart app
pm2 stop nexusbank            # Stop app
pm2 monit                     # Real-time monitoring dashboard
```

---

## Environment Variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site
NEXT_PUBLIC_SITE_URL=https://nexusbankuk.com
NEXT_PUBLIC_DEMO_MODE=false
```

> **Note:** `.env.local` is gitignored and must be created manually on each environment. Back it up before running `git clean`.

---

## Development

### Prerequisites

- Node.js 22.x
- npm 10+
- Supabase account and project

### Local Setup

```bash
# Clone repository
git clone git@github.com:wchloe7964/nexusbank.git
cd nexusbank

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Database Migrations

```bash
# Link to Supabase project
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push

# Seed initial data
npx supabase db seed
```

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Dev** | `npm run dev` | Start development server (port 3000) |
| **Build** | `npm run build` | Create optimised production build |
| **Start** | `npm run start` | Start production server |
| **Lint** | `npm run lint` | Run ESLint checks |

---

## Email Configuration

NexusBank supports SMTP email delivery via Brevo (SendinBlue) relay:

- **SMTP Host:** smtp-relay.brevo.com
- **Port:** 587 (STARTTLS)
- **Email Accounts:** `support@nexusbankuk.com`, `hesketh.t@nexusbankuk.com`
- **Mail Domain:** mail.nexusbankuk.com

---

## Compliance Standards

| Standard | Implementation |
|----------|---------------|
| **FCA** | Complaint handling (DISP rules), regulatory reporting |
| **PCI-DSS** | Card tokenization, access logging, no raw card storage |
| **PSD2** | Open Banking AISP endpoints, consent management |
| **AML** | Transaction screening, suspicious activity monitoring |
| **KYC** | Identity verification workflow with risk scoring |
| **GDPR** | Subject Access Requests, data privacy controls |
| **FSCS** | Financial Services Compensation Scheme compliance |

---

## License

Private and proprietary. All rights reserved.
