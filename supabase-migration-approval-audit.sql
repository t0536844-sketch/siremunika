-- Approval audit trail columns
-- Run in Supabase SQL Editor to add columns that track who approved/rejected and when, plus rejection reason.
ALTER TABLE approval ADD COLUMN IF NOT EXISTS approvedby TEXT DEFAULT NULL;
ALTER TABLE approval ADD COLUMN IF NOT EXISTS approvedat TEXT DEFAULT NULL;
ALTER TABLE approval ADD COLUMN IF NOT EXISTS rejectedby TEXT DEFAULT NULL;
ALTER TABLE approval ADD COLUMN IF NOT EXISTS rejectedat TEXT DEFAULT NULL;
ALTER TABLE approval ADD COLUMN IF NOT EXISTS alasantolak TEXT DEFAULT NULL;
