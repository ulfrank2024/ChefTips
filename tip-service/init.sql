-- This script initializes the database for the tip-service, creating all necessary tables and functions.

-- Table for Tip-Out Rules
CREATE TABLE tip_out_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    destination_role VARCHAR(255), -- Changed from destination_department_id
    calculation_basis VARCHAR(50) NOT NULL DEFAULT 'gross_tips' CHECK (calculation_basis IN ('gross_tips', 'total_sales')),
    percentage DECIMAL(5, 4),
    flat_amount DECIMAL(10, 2),
    distribution_type VARCHAR(50) NOT NULL DEFAULT 'DEPARTMENT_POOL',
    individual_recipient_roles JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (percentage IS NOT NULL OR flat_amount IS NOT NULL)
);

-- Table for Daily Tip Reports from Collectors
CREATE TABLE daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    role VARCHAR(255) NOT NULL, -- Changed from category_id
    service_date DATE NOT NULL,
    was_collector BOOLEAN NOT NULL,
    total_sales DECIMAL(10, 2),
    gross_tips DECIMAL(10, 2),
    net_tips DECIMAL(10, 2),
    service_end_time TIME,
    food_sales DECIMAL(10, 2),
    alcohol_sales DECIMAL(10, 2),
    cash_difference DECIMAL(10, 2),
    final_balance DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, company_id, service_date, role) -- Updated unique constraint
);

-- Table for Cash Outs (individual reports from collectors)
CREATE TABLE cash_outs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    role VARCHAR(255) NOT NULL,
    service_date DATE NOT NULL,
    was_collector BOOLEAN NOT NULL,
    total_sales DECIMAL(10, 2),
    gross_tips DECIMAL(10, 2),
    net_tips DECIMAL(10, 2),
    service_end_time TIME,
    food_sales DECIMAL(10, 2),
    alcohol_sales DECIMAL(10, 2),
    cash_difference DECIMAL(10, 2),
    final_balance DECIMAL(10, 2),
    daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for adjustments on daily reports
CREATE TABLE report_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    related_user_id UUID,
    rule_id UUID REFERENCES tip_out_rules(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Tip Pools
CREATE TABLE tip_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    role VARCHAR(255) NOT NULL, -- Changed from department_id
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Pool Distributions
CREATE TABLE pool_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES tip_pools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    hours_worked DECIMAL(10, 2) NOT NULL,
    distributed_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create triggers for automatic timestamp updates.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tip_out_rules_updated_at BEFORE UPDATE ON tip_out_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON daily_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();