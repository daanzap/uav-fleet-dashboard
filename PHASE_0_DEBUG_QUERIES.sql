-- ==========================================
-- Phase 0 除錯查詢
-- 用於診斷為什麼看不到載具
-- ==========================================

-- ===== 1. 檢查 vehicles 表是否有資料（繞過 RLS）=====
-- 需要在 Supabase Dashboard 以 service_role 權限執行
SELECT 
  id,
  name,
  status,
  department,
  deleted_at,
  created_at
FROM vehicles
ORDER BY created_at DESC;

-- ===== 2. 檢查當前使用者資訊 =====
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- ===== 3. 檢查當前使用者的 profile =====
SELECT 
  id,
  email,
  role,
  department
FROM profiles
WHERE id = auth.uid();

-- ===== 4. 檢查 vehicles 的 RLS 政策 =====
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'vehicles'
ORDER BY policyname;

-- ===== 5. 統計所有載具（不考慮 deleted_at）=====
SELECT 
  COUNT(*) as total_vehicles,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_vehicles,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_vehicles
FROM vehicles;

-- ===== 6. 依 department 統計載具 =====
SELECT 
  department,
  COUNT(*) as vehicle_count,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_count
FROM vehicles
GROUP BY department
ORDER BY department;

-- ==========================================
-- 可能的解決方案
-- ==========================================

-- 如果您的使用者沒有 department，請執行：
/*
UPDATE profiles 
SET department = 'R&D'
WHERE id = auth.uid();
*/

-- 如果 vehicles 表是空的，需要重新插入測試資料
-- 請參考原始的 seed data 或手動建立載具
