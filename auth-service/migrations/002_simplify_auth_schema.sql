-- Migration to simplify the auth service schema
-- Removes business logic (categories) that will be handled by the tip-service.

-- Step 1: Remove the static category_id from the company_memberships table.
ALTER TABLE company_memberships DROP COLUMN IF EXISTS category_id;

-- Step 2: Simplify the available roles. The 'server' role is deprecated.
-- A user is either a 'manager' or a generic 'employee'. Permissions will be handled by tip-service.
ALTER TABLE company_memberships DROP CONSTRAINT IF EXISTS company_memberships_role_check;
ALTER TABLE company_memberships ADD CONSTRAINT company_memberships_role_check CHECK (role IN ('manager', 'employee'));

-- Step 3: Drop the categories table as it will be recreated in the tip-service database.
DROP TABLE IF EXISTS categories;
