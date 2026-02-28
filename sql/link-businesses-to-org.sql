-- Link all businesses to an organization
-- Usage: wrangler d1 execute gee-ledger --local --file=sql/link-businesses-to-org.sql
--
-- This fixes businesses that have organization_id set to 'null' (string) or NULL

UPDATE businesses
SET organization_id = '6b705d2b-4215-45b9-9ace-338cacdf4c39'
WHERE organization_id IS NULL
   OR organization_id = 'null';
