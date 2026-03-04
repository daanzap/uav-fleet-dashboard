--==========================================
-- 安全檢查：確認 vehicles table 的欄位
-- 這個 SQL 只查詢，不會修改任何資料
-- 可以安全地在 Supabase SQL Editor 執行
--==========================================

-- 1. 查看 vehicles table 的所有欄位
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- 2. 檢查 parameter_change_notes 欄位是否存在
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'vehicles' 
            AND column_name = 'parameter_change_notes'
        ) 
        THEN '✅ parameter_change_notes 欄位已存在'
        ELSE '❌ parameter_change_notes 欄位不存在（需要新增）'
    END as status;

-- 3. 查看現有的 vehicles 資料（前 5 筆）
SELECT 
    id,
    name,
    status,
    department,
    created_at
FROM vehicles
ORDER BY created_at DESC
LIMIT 5;
