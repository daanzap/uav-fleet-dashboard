# 🚨 關鍵設計錯誤與修正方案

**日期：** 2026年2月4日  
**嚴重性：** 🔴 CRITICAL  
**狀態：** Phase 0 必須修正後才能繼續

---

## 🎯 正確的需求理解

### 使用者的真實需求：

#### 1. **動態載具管理**
- ✅ 可以新增任意數量的載具（不限於 7 台）
- ✅ 可以刪除載具（數量會減少）
- ✅ Dashboard 自動顯示所有載具
- ✅ 以 Grid 網格排列，每台載具一張 Card

#### 2. **命名規則（靈活但有規範）**

**格式：`[部門前綴]-[識別碼或描述]`**

| 部門 | 前綴 | 範例 |
|------|------|------|
| R&D | `RD-` | RD-117, RD-125, RD-High Altitude |
| Training（飛行員） | `Training-` | Training-933, Training_TBD |
| Marketing | `Marketing-` | Marketing-XXX（未來） |

**特點：**
- 自由命名（符合格式即可）
- 不是固定清單
- 未來可擴充新部門

#### 3. **目前狀態**
- 現在剛好有 7 台載具
- 這不是上限，只是現況
- 未來會增加或減少

---

## ❌ 目前設計的錯誤

### 錯誤 1：`constants.js` 限制了載具數量

```javascript
// src/lib/constants.js (第 6-15 行)

/** Allowed vehicle names to display on dashboard (only these 7; must match vehicles.name in DB) */
export const ALLOWED_VEHICLE_NAMES = [
  'RD-125',
  'RD-931',
  'RD-117',
  'RD-High Altitude',
  'RD-652 (TBD)',
  'Training-933',
  'Training_TBD',
]
```

**問題：**
- ❌ 註解說「only these 7」（只有這 7 個）
- ❌ 是硬編碼的固定清單
- ❌ 新增載具時無法顯示（除非修改程式碼）

---

### 錯誤 2：Dashboard 過濾邏輯

```javascript
// src/pages/Dashboard.jsx (第 47-48 行)

const allowedSet = new Set(ALLOWED_VEHICLE_NAMES)
const filtered = raw.filter(v => allowedSet.has(v.name))
```

**問題：**
- ❌ 只顯示在 `ALLOWED_VEHICLE_NAMES` 中的載具
- ❌ 新增的載具會被過濾掉
- ❌ 無法動態擴充

---

### 錯誤 3：SQL 腳本會刪除其他載具

```sql
-- db/08_vehicles_seven_names.sql (第 43-52 行)

-- Step 2: Remove any vehicle whose name is not one of the 7.
DELETE FROM vehicles
WHERE name NOT IN (
  'RD-117',
  'RD-125',
  'RD-652 (TBD)',
  'RD-931',
  'RD-High Altitude',
  'Training-933',
  'Training_TBD'
);
```

**問題：**
- ❌ 會刪除不在清單中的所有載具
- ❌ 破壞性操作
- ❌ 與動態管理的需求完全相反

---

### 錯誤 4：IMPLEMENTATION_PLAN 的 TODO-1.2

```markdown
5. Change vehicle name input to DROPDOWN instead of free text:
<select name="name" value={formData.name} onChange={handleChange} required>
  <option value="">Select Vehicle</option>
  {ALLOWED_VEHICLE_NAMES.map(name => (
    <option key={name} value={name}>{name}</option>
  ))}
</select>
```

**問題：**
- ❌ 使用 Dropdown 限制了命名自由
- ❌ 無法新增新的載具名稱
- ❌ 與需求完全相反

---

## ✅ 正確的設計方案

### 修正 1：移除 ALLOWED_VEHICLE_NAMES 限制

**方案 A：完全移除（推薦）**

```javascript
// src/lib/constants.js

/**
 * Shared constants for the fleet dashboard.
 */

// ❌ 刪除這個（不再需要）
// export const ALLOWED_VEHICLE_NAMES = [...]

/** 
 * Department prefixes for vehicle naming convention
 * Format: [PREFIX]-[IDENTIFIER]
 */
export const DEPARTMENT_PREFIXES = {
  RD: 'RD-',           // R&D Department
  TRAINING: 'Training-', // Pilot Training
  MARKETING: 'Marketing-' // Marketing (future)
}

/** Pilot options for booking: static list in alphabetical order (PRD) */
export const PILOT_OPTIONS = [
  'Devon',
  'Edine',
  'Ezgi',
  'Jaco',
  'Michael',
  'Renzo',
  'Thijm',
  'Tjeerd',
  'Yamac',
]
```

**方案 B：改為驗證函數（選擇性）**

```javascript
/**
 * Validates vehicle name format
 * @param {string} name - Vehicle name to validate
 * @returns {boolean} - True if valid format
 */
export function isValidVehicleName(name) {
  const validPrefixes = ['RD-', 'Training-', 'Marketing-']
  return validPrefixes.some(prefix => name.startsWith(prefix))
}
```

---

### 修正 2：Dashboard 顯示所有載具

```javascript
// src/pages/Dashboard.jsx

const fetchVehicles = async () => {
    try {
        setLoading(true)
        const { data: vehiclesData, error: vehiclesError } = await supabase
            .from('vehicles')
            .select('*')
            .order('created_at', { ascending: false })

        if (vehiclesError) throw vehiclesError
        const raw = vehiclesData || []

        // ✅ 移除過濾邏輯 - 顯示所有載具
        // ❌ 舊的：const allowedSet = new Set(ALLOWED_VEHICLE_NAMES)
        // ❌ 舊的：const filtered = raw.filter(v => allowedSet.has(v.name))
        
        // ✅ 新的：依名稱排序即可
        const sorted = [...raw].sort((a, b) => 
            (a.name || '').localeCompare(b.name || '')
        )

        if (sorted.length === 0) {
            setVehicles([])
            setLoading(false)
            return
        }

        // 取得預訂資訊（邏輯不變）
        const vehicleIds = sorted.map(v => v.id)
        const now = new Date().toISOString()
        const { data: bookingsData } = await supabase
            .from('bookings')
            .select('id, vehicle_id, start_time, project_name')
            .in('vehicle_id', vehicleIds)
            .gte('start_time', now)
            .order('start_time', { ascending: true })

        // ... 其餘邏輯不變
    } catch (error) {
        console.error('Error fetching vehicles:', error)
        setVehicles([])
    } finally {
        setLoading(false)
    }
}
```

---

### 修正 3：EditVehicleModal 保持自由輸入（加上驗證）

```javascript
// src/components/EditVehicleModal.jsx

// ✅ 保持 text input，不改成 dropdown
<div className="edit-form-group">
    <label>Vehicle Name</label>
    <input
        name="name"
        required
        value={formData.name}
        onChange={handleChange}
        placeholder="e.g. RD-117, Training-933, Marketing-001"
    />
    <small style={{ color: '#888', fontSize: '0.85em' }}>
        Format: [Department]-[Identifier] 
        (e.g., RD-117, Training-933, Marketing-XXX)
    </small>
</div>

// 選擇性：新增驗證（如果需要）
const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 選擇性驗證（可以不加）
    const validPrefixes = ['RD-', 'Training-', 'Marketing-']
    const hasValidPrefix = validPrefixes.some(prefix => 
        formData.name.startsWith(prefix)
    )
    
    if (!hasValidPrefix) {
        const confirm = window.confirm(
            `Vehicle name "${formData.name}" doesn't follow the standard format.\n` +
            `Expected format: [RD- | Training- | Marketing-][Identifier]\n\n` +
            `Continue anyway?`
        )
        if (!confirm) return
    }
    
    // 繼續原本的儲存邏輯...
}
```

---

### 修正 4：修正或刪除 TODO-0.2 SQL 腳本

**選項 A：完全刪除這個腳本（推薦）**

如果目前資料庫狀態可接受，就不需要執行這個腳本。

**選項 B：修改為清理腳本（只刪除明顯錯誤的）**

```sql
-- db/08_cleanup_invalid_vehicles.sql（新名稱）

-- 只刪除明顯無效的載具（例如測試資料）
DELETE FROM vehicles
WHERE 
  -- 空白或太短的名稱
  name IS NULL 
  OR TRIM(name) = '' 
  OR LENGTH(TRIM(name)) < 3
  -- 或明顯的測試資料
  OR name IN ('test', 'Test', 'TEST', '123', 'abc', 'xxx');

-- 確認結果
SELECT name, department, status 
FROM vehicles 
ORDER BY name;
```

**選項 C：只保留合格載具**

```sql
-- 只保留符合命名規則的載具
DELETE FROM vehicles
WHERE NOT (
  name LIKE 'RD-%' 
  OR name LIKE 'Training-%' 
  OR name LIKE 'Marketing-%'
);
```

---

## 🎯 Phase 0 修正版計劃

### TODO-0.1: 資料庫備份 ✅
（已完成）

---

### TODO-0.2: 清理資料庫（修正版）

**目標：** 只移除無效或測試資料，保留所有合法載具

**修正後的 SQL：**

```sql
-- ============================================
-- TODO-0.2 修正版：清理無效資料
-- 不限制載具數量，不限制名稱清單
-- ============================================

-- Step 1: 檢查目前的載具
SELECT id, name, department, status, created_at
FROM vehicles
ORDER BY created_at;

-- Step 2: 刪除明顯無效的測試資料
DELETE FROM vehicles
WHERE 
  -- 空白或太短的名稱
  (name IS NULL OR TRIM(name) = '' OR LENGTH(TRIM(name)) < 3)
  -- 明顯的測試資料
  OR name IN ('test', 'Test', 'TEST', '123', 'abc', 'xxx', 'temp');

-- Step 3: （選擇性）刪除不符合命名規則的載具
-- 只在需要時執行這段
-- DELETE FROM vehicles
-- WHERE NOT (
--   name LIKE 'RD-%' 
--   OR name LIKE 'Training-%' 
--   OR name LIKE 'Marketing-%'
-- );

-- Step 4: 確認結果
SELECT 
  COUNT(*) as total_vehicles,
  department,
  COUNT(*) as count_by_dept
FROM vehicles
GROUP BY department
ORDER BY department;

-- Step 5: 列出所有載具
SELECT name, department, status 
FROM vehicles 
ORDER BY name;
```

---

### TODO-0.3: 移除 risk_level（不變）
（維持原計劃）

---

### TODO-0.4: 新增 deleted_at（不變）
（維持原計劃）

---

### TODO-0.5: 建立 change_logs（不變）
（維持原計劃）

---

## 🎯 Phase 1 修正版計劃

### ❌ 刪除 TODO-1.2（Dropdown 設計錯誤）

原本的 TODO-1.2 要求將名稱改成 Dropdown，這與需求相反。

---

### ✅ 新的 TODO-1.2：移除 ALLOWED_VEHICLE_NAMES 限制

**任務：** 修正 Dashboard 過濾邏輯

**檔案：**
- `src/lib/constants.js` - 刪除或重構 ALLOWED_VEHICLE_NAMES
- `src/pages/Dashboard.jsx` - 移除過濾邏輯
- `src/components/EditVehicleModal.jsx` - 確認可自由輸入

**驗收標準：**
- [ ] 新增任意名稱的載具後，Dashboard 可以顯示
- [ ] 不再受限於固定清單
- [ ] 符合命名規則的載具都能正常運作

---

## 📋 立即行動項目

### 🚨 在執行 Phase 0 前，必須先做：

1. **停止！不要執行 `db/08_vehicles_seven_names.sql`**
   - ❌ 這個腳本會刪除載具
   - ❌ 與需求相反

2. **決定清理策略：**
   - 選項 A：不清理，保留目前 9 台載具
   - 選項 B：只刪除明顯測試資料（"123", "RD-Test"）
   - 選項 C：刪除不符合命名規則的載具

3. **修正程式碼：**
   - 移除 Dashboard 的過濾邏輯
   - 修正 constants.js
   - 確保可以自由新增載具

---

## 🎯 建議的執行順序

### Phase 0 修正版

1. ✅ TODO-0.1: 備份（已完成）

2. ⬜ **新的決策點：清理資料庫**
   - 詢問使用者：要保留哪些載具？
   - 只刪除確定無用的測試資料
   - 不強制 7 台限制

3. ⬜ TODO-0.3: 移除 risk_level（維持原計劃）

4. ⬜ TODO-0.4: 新增 deleted_at（維持原計劃）

5. ⬜ TODO-0.5: 建立 change_logs（維持原計劃）

### Phase 1 修正版

6. ⬜ **修正 TODO-1.2：移除 ALLOWED_VEHICLE_NAMES 限制**
   - 修正 constants.js
   - 修正 Dashboard.jsx 過濾邏輯
   - 確保動態載具管理可運作

7. ⬜ TODO-1.3: 移除前端 risk_level UI（維持原計劃）

---

## 💡 額外建議

### 1. 命名驗證（選擇性）

可以加上提示，但不強制：

```javascript
// 驗證函數（僅提示，不阻止）
function validateVehicleName(name) {
  const prefixes = ['RD-', 'Training-', 'Marketing-']
  const hasPrefix = prefixes.some(p => name.startsWith(p))
  
  if (!hasPrefix) {
    return {
      valid: false,
      suggestion: `建議格式：${prefixes.join(' | ')}[識別碼]`
    }
  }
  return { valid: true }
}
```

### 2. Department 自動判斷

```javascript
// 根據名稱自動設定 department
function getDepartmentFromName(name) {
  if (name.startsWith('RD-')) return 'R&D'
  if (name.startsWith('Training-')) return 'Training'
  if (name.startsWith('Marketing-')) return 'Marketing'
  return 'R&D' // 預設
}
```

### 3. UI 改善

在 EditVehicleModal 加上命名指引：

```jsx
<div className="naming-guide" style={{ 
  background: '#f0f9ff', 
  padding: '12px', 
  borderRadius: '4px',
  marginBottom: '12px'
}}>
  <strong>📝 命名規則：</strong>
  <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
    <li>R&D 部門：RD-[編號或描述] (例：RD-117, RD-High Altitude)</li>
    <li>Training 部門：Training-[編號] (例：Training-933)</li>
    <li>Marketing 部門：Marketing-[編號] (例：Marketing-001)</li>
  </ul>
</div>
```

---

## ✅ 結論

**目前的設計確實有嚴重問題：**
- ❌ 限制了載具數量
- ❌ 限制了命名自由
- ❌ 無法動態擴充

**正確的設計應該：**
- ✅ 支援任意數量的載具
- ✅ 自由命名（符合格式即可）
- ✅ Dashboard 自動顯示所有載具
- ✅ 可以新增、編輯、刪除

**下一步：**
1. 確認使用者要保留哪些現有載具
2. 修正程式碼（移除限制）
3. 測試動態新增/刪除功能

---

**非常感謝你及時指出這個問題！** 🙏

如果不是你的澄清，我們就會執行錯誤的設計，造成系統無法擴充！
