-- Activate Pro plan for an organization
-- Usage: wrangler d1 execute gee-ledger --local --file=sql/activate-pro-plan.sql
--
-- Before running, replace YOUR_ORGANIZATION_ID with your actual organization ID.
-- Find it by running: SELECT id, name FROM organizations;

INSERT INTO subscriptions (id, organization_id, plan_key, status, current_period_start, current_period_end, created_at, updated_at)
VALUES (
           lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))),
           'YOUR_ORGANIZATION_ID',
           'pro',
           'active',
           date('now'),
           date('now', '+1 year'),
           datetime('now'),
           datetime('now')
       );
