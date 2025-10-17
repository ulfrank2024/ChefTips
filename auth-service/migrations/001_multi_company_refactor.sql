-- Migration to refactor the database for multi-company user support

BEGIN;

-- Step 1: Create the new company_memberships table
-- This table will link users to companies and define their role/category within that company.
CREATE TABLE IF NOT EXISTS company_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    category_id UUID, -- Can be NULL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- A user can only have one entry per company
    CONSTRAINT unique_user_per_company UNIQUE (user_id, company_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_memberships_user_id ON company_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_company_memberships_company_id ON company_memberships(company_id);

-- Step 2: Migrate existing data from the 'users' table
-- For every user that belongs to a company, create a membership entry.
INSERT INTO company_memberships (user_id, company_id, role, category_id)
SELECT id, company_id, role, category_id
FROM users
WHERE company_id IS NOT NULL AND role IS NOT NULL;

-- Step 3: Remove the old, now redundant columns from the 'users' table
-- In a live production environment, this would likely be a separate, later migration
-- after deploying code that uses the new table. For development, we do it in one go.
ALTER TABLE users DROP COLUMN IF EXISTS company_id;
ALTER TABLE users DROP COLUMN IF EXISTS role;
ALTER TABLE users DROP COLUMN IF EXISTS category_id;

-- Step 4: Set up the updated_at trigger for the new table
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_company_memberships_updated_at ON company_memberships;
CREATE TRIGGER set_company_memberships_updated_at
BEFORE UPDATE ON company_memberships
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

COMMIT;
