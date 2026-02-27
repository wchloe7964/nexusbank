-- =============================================
-- NexusBank - Seed Data
-- =============================================
-- Note: The initial user must be created via Supabase Auth first.
-- Use the dashboard or CLI to create a user with:
--   Email: james.richardson@nexusbankuk.com
--   Password: NexusBank2025!
-- Then update the UUID below to match.

-- For local dev, you can use a fixed UUID:
DO $$
DECLARE
  demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
  current_acct_id UUID := 'a0000000-0000-0000-0000-000000000001';
  savings_acct_id UUID := 'a0000000-0000-0000-0000-000000000002';
  isa_acct_id UUID := 'a0000000-0000-0000-0000-000000000003';
  card_debit_id UUID := 'c0000000-0000-0000-0000-000000000001';
  card_credit_id UUID := 'c0000000-0000-0000-0000-000000000002';
BEGIN

-- Profile
INSERT INTO public.profiles (id, email, full_name, phone_number, address_line_1, city, postcode)
VALUES (demo_user_id, 'james.richardson@nexusbankuk.com', 'James Richardson', '+44 7700 900123',
        '42 King Street', 'London', 'EC2V 8AT')
ON CONFLICT (id) DO NOTHING;

-- Accounts
INSERT INTO public.accounts (id, user_id, account_name, account_type, sort_code, account_number, balance, available_balance, is_primary, interest_rate, overdraft_limit) VALUES
(current_acct_id, demo_user_id, 'Nexus Current Account', 'current', '20-45-67', '41234567', 3247.85, 4247.85, TRUE, 0.0000, 1000.00),
(savings_acct_id, demo_user_id, 'Rainy Day Saver', 'savings', '20-45-67', '51234568', 12500.50, 12500.50, FALSE, 0.0415, 0.00),
(isa_acct_id, demo_user_id, 'Cash ISA', 'isa', '20-45-67', '61234569', 8750.00, 8750.00, FALSE, 0.0500, 0.00)
ON CONFLICT DO NOTHING;

-- Transactions for Current Account
INSERT INTO public.transactions (account_id, type, category, amount, description, counterparty_name, balance_after, transaction_date, status) VALUES
(current_acct_id, 'debit', 'bills', 850.00, 'Monthly Rent', 'Property Mgmt Ltd', 3247.85, NOW() - INTERVAL '1 day', 'completed'),
(current_acct_id, 'credit', 'salary', 3200.00, 'Monthly Salary', 'ACME Corp Ltd', 4097.85, NOW() - INTERVAL '2 days', 'completed'),
(current_acct_id, 'debit', 'bills', 125.00, 'Council Tax', 'London Borough Council', 897.85, NOW() - INTERVAL '3 days', 'completed'),
(current_acct_id, 'debit', 'groceries', 67.43, 'Weekly Shop', 'Tesco Stores', 1022.85, NOW() - INTERVAL '4 days', 'completed'),
(current_acct_id, 'debit', 'transport', 156.00, 'Monthly Travelcard', 'TfL', 1090.28, NOW() - INTERVAL '5 days', 'completed'),
(current_acct_id, 'debit', 'subscriptions', 15.99, 'Netflix Monthly', 'Netflix.com', 1246.28, NOW() - INTERVAL '6 days', 'completed'),
(current_acct_id, 'debit', 'dining', 42.50, 'Dinner', 'Dishoom Kings Cross', 1262.27, NOW() - INTERVAL '7 days', 'completed'),
(current_acct_id, 'debit', 'shopping', 89.99, 'Running Shoes', 'Nike London', 1304.77, NOW() - INTERVAL '8 days', 'completed'),
(current_acct_id, 'debit', 'entertainment', 12.99, 'Spotify Premium', 'Spotify AB', 1394.76, NOW() - INTERVAL '9 days', 'completed'),
(current_acct_id, 'debit', 'bills', 45.00, 'Mobile Phone', 'Three UK', 1407.75, NOW() - INTERVAL '10 days', 'completed'),
(current_acct_id, 'debit', 'health', 39.99, 'Gym Membership', 'PureGym Ltd', 1452.75, NOW() - INTERVAL '11 days', 'completed'),
(current_acct_id, 'debit', 'groceries', 34.21, 'Mid-week shop', 'Sainsburys', 1492.74, NOW() - INTERVAL '12 days', 'completed'),
(current_acct_id, 'debit', 'cash', 50.00, 'ATM Withdrawal', 'NexusBank ATM', 1526.95, NOW() - INTERVAL '13 days', 'completed'),
(current_acct_id, 'debit', 'entertainment', 25.00, 'Cinema', 'Odeon Leicester Sq', 1576.95, NOW() - INTERVAL '14 days', 'completed'),
(current_acct_id, 'credit', 'transfer', 500.00, 'Transfer from Savings', 'Own Account', 1601.95, NOW() - INTERVAL '15 days', 'completed'),
(current_acct_id, 'debit', 'shopping', 34.99, 'Book Order', 'Amazon.co.uk', 1101.95, NOW() - INTERVAL '16 days', 'completed'),
(current_acct_id, 'debit', 'dining', 28.50, 'Lunch', 'Pret A Manger', 1136.94, NOW() - INTERVAL '17 days', 'completed'),
(current_acct_id, 'debit', 'groceries', 82.16, 'Weekly Shop', 'Waitrose', 1165.44, NOW() - INTERVAL '18 days', 'completed'),
(current_acct_id, 'debit', 'bills', 89.00, 'Broadband', 'BT Group', 1247.60, NOW() - INTERVAL '19 days', 'completed'),
(current_acct_id, 'debit', 'transport', 3.50, 'Bus Fare', 'TfL', 1336.60, NOW() - INTERVAL '20 days', 'completed'),
(current_acct_id, 'debit', 'dining', 15.90, 'Coffee & Pastry', 'Costa Coffee', 1340.10, NOW() - INTERVAL '21 days', 'completed'),
(current_acct_id, 'debit', 'education', 29.99, 'Online Course', 'Udemy', 1356.00, NOW() - INTERVAL '22 days', 'completed'),
(current_acct_id, 'credit', 'other', 50.00, 'Refund', 'Amazon.co.uk', 1385.99, NOW() - INTERVAL '23 days', 'completed'),
(current_acct_id, 'debit', 'shopping', 145.00, 'Winter Coat', 'John Lewis', 1335.99, NOW() - INTERVAL '24 days', 'completed'),
(current_acct_id, 'debit', 'groceries', 55.80, 'Weekly Shop', 'Tesco Stores', 1480.99, NOW() - INTERVAL '25 days', 'completed'),
(current_acct_id, 'credit', 'salary', 3200.00, 'Monthly Salary', 'ACME Corp Ltd', 1536.79, NOW() - INTERVAL '30 days', 'completed'),
(current_acct_id, 'debit', 'bills', 850.00, 'Monthly Rent', 'Property Mgmt Ltd', -1663.21, NOW() - INTERVAL '31 days', 'completed'),
-- Pending transaction
(current_acct_id, 'debit', 'shopping', 24.99, 'Online Order', 'ASOS.com', 3222.86, NOW() - INTERVAL '2 hours', 'pending');

-- Transactions for Savings Account
INSERT INTO public.transactions (account_id, type, category, amount, description, counterparty_name, balance_after, transaction_date, status) VALUES
(savings_acct_id, 'credit', 'transfer', 200.00, 'Monthly Savings', 'Own Account', 12500.50, NOW() - INTERVAL '3 days', 'completed'),
(savings_acct_id, 'debit', 'transfer', 500.00, 'Transfer to Current', 'Own Account', 12300.50, NOW() - INTERVAL '15 days', 'completed'),
(savings_acct_id, 'credit', 'transfer', 200.00, 'Monthly Savings', 'Own Account', 12800.50, NOW() - INTERVAL '33 days', 'completed'),
(savings_acct_id, 'credit', 'other', 43.12, 'Interest Payment', 'NexusBank', 12600.50, NOW() - INTERVAL '30 days', 'completed');

-- Transactions for ISA
INSERT INTO public.transactions (account_id, type, category, amount, description, counterparty_name, balance_after, transaction_date, status) VALUES
(isa_acct_id, 'credit', 'transfer', 500.00, 'ISA Deposit', 'Own Account', 8750.00, NOW() - INTERVAL '5 days', 'completed'),
(isa_acct_id, 'credit', 'other', 36.25, 'Interest Payment', 'NexusBank', 8250.00, NOW() - INTERVAL '30 days', 'completed');

-- Cards
INSERT INTO public.cards (id, account_id, user_id, card_type, card_number_last_four, card_holder_name, expiry_date, spending_limit_daily, spending_limit_monthly) VALUES
(card_debit_id, current_acct_id, demo_user_id, 'debit', '4589', 'MR J RICHARDSON', '09/27', 5000.00, 25000.00),
(card_credit_id, current_acct_id, demo_user_id, 'credit', '7823', 'MR J RICHARDSON', '03/28', 2000.00, 10000.00)
ON CONFLICT DO NOTHING;

-- Payees
INSERT INTO public.payees (user_id, name, sort_code, account_number, reference, is_favourite) VALUES
(demo_user_id, 'Sarah Richardson', '30-90-12', '12345678', 'Family', TRUE),
(demo_user_id, 'British Gas', '40-12-34', '87654321', 'Gas Bill', FALSE),
(demo_user_id, 'HMRC', '08-32-10', '11223344', 'Self Assessment', FALSE),
(demo_user_id, 'Landlord - PMC Ltd', '20-00-00', '55667788', 'Rent', TRUE),
(demo_user_id, 'David Chen', '20-18-45', '99887766', 'Shared expenses', FALSE)
ON CONFLICT DO NOTHING;

-- Scheduled Payments
INSERT INTO public.scheduled_payments (user_id, from_account_id, payment_type, amount, reference, description, frequency, next_payment_date, status) VALUES
(demo_user_id, current_acct_id, 'standing_order', 200.00, 'Monthly Save', 'Savings Transfer', 'monthly', (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' + INTERVAL '1 day')::DATE, 'active'),
(demo_user_id, current_acct_id, 'direct_debit', 45.00, 'Three Mobile', 'Phone Bill', 'monthly', (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' + INTERVAL '14 days')::DATE, 'active'),
(demo_user_id, current_acct_id, 'direct_debit', 125.00, 'Council Tax', 'Council Tax', 'monthly', (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE, 'active'),
(demo_user_id, current_acct_id, 'direct_debit', 89.00, 'BT Broadband', 'Broadband', 'monthly', (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' + INTERVAL '19 days')::DATE, 'active'),
(demo_user_id, current_acct_id, 'standing_order', 850.00, 'PMC Ltd', 'Rent', 'monthly', (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE, 'active'),
(demo_user_id, current_acct_id, 'direct_debit', 39.99, 'PureGym', 'Gym Membership', 'monthly', (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' + INTERVAL '11 days')::DATE, 'active');

-- Notifications
INSERT INTO public.notifications (user_id, title, message, type, is_read, action_url) VALUES
(demo_user_id, 'Salary Received', 'You received £3,200.00 from ACME Corp Ltd', 'transaction', FALSE, '/transactions'),
(demo_user_id, 'Direct Debit Coming Up', 'Council Tax of £125.00 due on 1st March', 'account', FALSE, '/payments'),
(demo_user_id, 'Security Alert', 'New device logged in from London, UK', 'security', TRUE, '/settings/security'),
(demo_user_id, 'ISA Rate Increase', 'Your Cash ISA rate has increased to 5.00% AER', 'promotion', FALSE, '/accounts'),
(demo_user_id, 'Rent Payment Sent', 'Standing order of £850.00 to PMC Ltd processed', 'transaction', TRUE, '/transactions'),
(demo_user_id, 'Card Used Abroad', 'Your debit card ending 4589 was used in Paris, France', 'security', FALSE, '/cards');

-- Savings Goals
INSERT INTO public.savings_goals (user_id, account_id, name, goal_type, target_amount, current_amount, target_date, color, is_completed, completed_at) VALUES
(demo_user_id, savings_acct_id, 'Summer Holiday', 'holiday', 2500.00, 1450.00, (NOW() + INTERVAL '4 months')::DATE, 'orange', FALSE, NULL),
(demo_user_id, savings_acct_id, 'Emergency Fund', 'emergency-fund', 5000.00, 3200.00, NULL, 'red', FALSE, NULL),
(demo_user_id, savings_acct_id, 'House Deposit', 'home-deposit', 25000.00, 8750.00, (NOW() + INTERVAL '2 years')::DATE, 'blue', FALSE, NULL),
(demo_user_id, savings_acct_id, 'New Laptop', 'other', 1200.00, 1200.00, NULL, 'purple', TRUE, NOW() - INTERVAL '14 days');

-- Budgets
INSERT INTO public.budgets (user_id, category, monthly_limit, alert_threshold) VALUES
(demo_user_id, 'groceries', 400.00, 0.80),
(demo_user_id, 'dining', 150.00, 0.80),
(demo_user_id, 'entertainment', 100.00, 0.80),
(demo_user_id, 'shopping', 200.00, 0.75),
(demo_user_id, 'transport', 120.00, 0.85),
(demo_user_id, 'subscriptions', 50.00, 0.90),
(demo_user_id, 'bills', 800.00, 0.90);

-- Login Activity
INSERT INTO public.login_activity (user_id, event_type, ip_address, device_type, browser, os, location, is_suspicious, created_at) VALUES
(demo_user_id, 'login_success', '192.168.1.42', 'desktop', 'Chrome 120', 'macOS', 'London, UK', FALSE, NOW() - INTERVAL '2 hours'),
(demo_user_id, 'login_success', '192.168.1.42', 'desktop', 'Chrome 120', 'macOS', 'London, UK', FALSE, NOW() - INTERVAL '1 day'),
(demo_user_id, 'login_success', '10.0.0.15', 'mobile', 'Safari 17', 'iOS 17', 'London, UK', FALSE, NOW() - INTERVAL '2 days'),
(demo_user_id, 'login_failed', '203.45.67.89', 'unknown', NULL, NULL, 'Mumbai, India', TRUE, NOW() - INTERVAL '3 days'),
(demo_user_id, 'password_changed', '192.168.1.42', 'desktop', 'Chrome 120', 'macOS', 'London, UK', FALSE, NOW() - INTERVAL '5 days'),
(demo_user_id, 'login_success', '192.168.1.42', 'desktop', 'Firefox 121', 'Windows 11', 'London, UK', FALSE, NOW() - INTERVAL '7 days'),
(demo_user_id, 'two_factor_enabled', '192.168.1.42', 'desktop', 'Chrome 120', 'macOS', 'London, UK', FALSE, NOW() - INTERVAL '10 days');

END $$;
