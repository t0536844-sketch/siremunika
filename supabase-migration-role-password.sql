-- Migration: Convert mst_role.id and mst_user.roleid from integer to text (string RoleId)
--             Add password column to mst_user
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/npasitielsksoksctqbv/sql

-- Step 1: Drop foreign key constraint on mst_user.roleid → mst_role.id
-- (Supabase auto-creates FK constraints; we need to drop before altering column type)
ALTER TABLE mst_user DROP CONSTRAINT IF EXISTS mst_user_roleid_fkey;

-- Step 2: Alter mst_role.id from integer to text
ALTER TABLE mst_role ALTER COLUMN id TYPE text USING id::text;

-- Step 3: Alter mst_user.roleid from integer to text (allows string RoleIds)
ALTER TABLE mst_user ALTER COLUMN roleid TYPE text USING roleid::text;

-- Step 4: Seed mst_role.id with string RoleId values matching frontend
UPDATE mst_role SET id = 'superadmin'       WHERE id = '1';
UPDATE mst_role SET id = 'kepala_keuangan'  WHERE id = '2';
UPDATE mst_role SET id = 'direktur'         WHERE id = '3';
UPDATE mst_role SET id = 'kepala_unit'      WHERE id = '4';
UPDATE mst_role SET id = 'operator_unit'    WHERE id = '5';
-- Add missing roles that frontend expects
INSERT INTO mst_role (id, namarole, level, deskripsi) VALUES
  ('admin_keuangan', 'Admin Keuangan', 'keuangan', 'Manajemen data keuangan dan pendapatan'),
  ('verifikator', 'Verifikator', 'verifikasi', 'Verifikasi dan approval data remunerasi'),
  ('viewer', 'Viewer', 'viewer', 'Akses lihat saja, tidak bisa edit')
ON CONFLICT (id) DO NOTHING;

-- Step 5: Update mst_user.roleid values to match new string RoleIds
-- (Currently all are NULL, so we set them based on jabatan/unit)
UPDATE mst_user SET roleid = 'superadmin'       WHERE jabatan = 'System Administrator';
UPDATE mst_user SET roleid = 'direktur'          WHERE jabatan LIKE '%Direktur%';
UPDATE mst_user SET roleid = 'kepala_keuangan'   WHERE jabatan LIKE '%Kepala Bagian Keuangan%';
UPDATE mst_user SET roleid = 'admin_keuangan'    WHERE jabatan LIKE '%Staff Keuangan%' AND roleid IS NULL;
UPDATE mst_user SET roleid = 'kepala_unit'       WHERE jabatan LIKE '%Kepala%' AND roleid IS NULL;
UPDATE mst_user SET roleid = 'operator_unit'     WHERE roleid IS NULL;

-- Step 6: Re-create foreign key constraint (now text → text)
ALTER TABLE mst_user ADD CONSTRAINT mst_user_roleid_fkey
  FOREIGN KEY (roleid) REFERENCES mst_role(id) ON DELETE SET NULL;

-- Step 7: Add password column to mst_user
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS password TEXT DEFAULT NULL;

-- Done! Verify:
-- SELECT * FROM mst_role ORDER BY id;
-- SELECT id, nama, username, roleid FROM mst_user ORDER BY id;
