-- This script initializes the database for the tip-service, creating all necessary tables and functions.

-- Step 1: Create the core tables.

-- Table for Departments (e.g., Front of House, Kitchen)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    department_type VARCHAR(50) NOT NULL DEFAULT 'COLLECTOR',
    category_distribution JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Table for Categories (Job Titles) linked to Departments
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_dual_role BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Table for Tip-Out Rules
CREATE TABLE tip_out_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    source_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    destination_department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    calculation_basis VARCHAR(50) NOT NULL DEFAULT 'gross_tips' CHECK (calculation_basis IN ('gross_tips', 'total_sales')),
    percentage DECIMAL(5, 4),
    flat_amount DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (percentage IS NOT NULL OR flat_amount IS NOT NULL)
);

-- Table for Daily Tip Reports from Collectors
CREATE TABLE daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    service_date DATE NOT NULL,
    was_collector BOOLEAN NOT NULL,
    total_sales DECIMAL(10, 2),
    gross_tips DECIMAL(10, 2),
    net_tips DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, company_id, service_date, category_id)
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

-- Step 2: Create triggers for automatic timestamp updates.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tip_out_rules_updated_at BEFORE UPDATE ON tip_out_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON daily_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Added from migration 009_create_pools_tables.sql
CREATE TABLE tip_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pool_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES tip_pools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    hours_worked DECIMAL(10, 2) NOT NULL,
    distributed_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
