-- Cleanup stale organization_members records
-- Removes non-owner members who no longer belong to any business in the org.
-- This fixes seats not being freed when members were removed before the bug fix.

-- Step 1: Preview stale records (run this first)
SELECT om.id, om.organization_id, om.user_id, om.role
FROM organization_members om
WHERE om.role != 'owner'
  AND NOT EXISTS (
    SELECT 1
    FROM user_business_roles ubr
    JOIN businesses b ON b.id = ubr.business_id
    WHERE ubr.user_id = om.user_id
      AND b.organization_id = om.organization_id
      AND b.deleted_at IS NULL
  );

-- Step 2: Delete stale records (run after verifying Step 1 output)
-- DELETE FROM organization_members
-- WHERE role != 'owner'
--   AND id IN (
--     SELECT om.id
--     FROM organization_members om
--     WHERE NOT EXISTS (
--       SELECT 1
--       FROM user_business_roles ubr
--       JOIN businesses b ON b.id = ubr.business_id
--       WHERE ubr.user_id = om.user_id
--         AND b.organization_id = om.organization_id
--         AND b.deleted_at IS NULL
--     )
--   );

-- Step 3: After cleanup, manually adjust extraSeats in subscriptions table
-- and Stripe dashboard for affected organizations.
