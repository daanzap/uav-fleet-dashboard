-- ==========================================
-- Phase 0 驗證查詢
-- 在 Supabase SQL Editor 執行這些查詢來確認遷移成功
-- ==========================================

-- ===== 驗證 1: 檢查 vehicles 表結構 =====
-- 預期: 應該有 deleted_at，但沒有 risk_level
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- ===== 驗證 2: 檢查 bookings 表結構 =====
-- 預期: 應該同時有 risk_level 和 deleted_at
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- ===== 驗證 3: 確認 change_logs 表存在 =====
-- 預期: 回傳 1
SELECT COUNT(*) as change_logs_exists
FROM information_schema.tables 
WHERE table_name = 'change_logs';

-- ===== 驗證 4: 檢查 change_logs 表結構 =====
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'change_logs'
ORDER BY ordinal_position;

-- ===== 驗證 5: 確認索引已建立 =====
-- 預期: 至少 3 個索引 (不含主鍵)
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'change_logs'
ORDER BY indexname;

-- ===== 驗證 6: 檢查 RLS 政策 =====
-- 預期: vehicles, bookings, change_logs 都有政策
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('vehicles', 'bookings', 'change_logs')
ORDER BY tablename, policyname;

-- ===== 驗證 7: 計算活躍載具數量 =====
-- 預期: 7 台載具 (deleted_at IS NULL)
SELECT COUNT(*) as active_vehicles
FROM vehicles
WHERE deleted_at IS NULL;

-- ===== 驗證 8: 檢查是否有被軟刪除的記錄 =====
-- 預期: 0 (沒有被刪除的記錄)
SELECT 
  'vehicles' as table_name,
  COUNT(*) as deleted_count
FROM vehicles
WHERE deleted_at IS NOT NULL
UNION ALL
SELECT 
  'bookings' as table_name,
  COUNT(*) as deleted_count
FROM bookings
WHERE deleted_at IS NOT NULL;

-- ===== 驗證 9: 測試 change_logs 插入 =====
-- 這會插入一筆測試記錄
INSERT INTO change_logs (
  user_email,
  user_display_name,
  entity_type,
  entity_id,
  entity_name,
  action_type,
  notes
) VALUES (
  'verification@test.com',
  'Verification Test',
  'vehicle',
  gen_random_uuid(),
  'Test Vehicle',
  'create',
  'Phase 0 verification test - safe to delete'
);

-- ===== 驗證 10: 查詢剛插入的測試記錄 =====
SELECT 
  id,
  created_at,
  user_email,
  entity_type,
  action_type,
  notes
FROM change_logs
WHERE notes = 'Phase 0 verification test - safe to delete'
ORDER BY created_at DESC
LIMIT 1;

-- ===== 清理測試記錄 =====
DELETE FROM change_logs
WHERE notes = 'Phase 0 verification test - safe to delete';

-- ==========================================
-- ✅ 如果以上查詢都成功執行，Phase 0 遷移完全成功！
-- ==========================================
