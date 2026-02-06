# 設計分析：Dashboard 資料更新機制

**分析日期：** 2026年2月4日  
**分析者：** Phase 0 實施前的審查  
**狀態：** ⚠️ 發現潛在問題

---

## 🎯 你提出的關鍵問題

### 問題 1：新增/刪除 Vehicle 後，Dashboard 會自動更新數量嗎？
### 問題 2：編輯 Vehicle 內容後，Dashboard 和 DB 會跟著變動嗎？

---

## 📊 目前實作分析

### 1. Dashboard.jsx 資料流

```javascript
// Dashboard.jsx (第 36-87 行)

const fetchVehicles = async () => {
    // 1. 從 Supabase 取得所有 vehicles
    const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })
    
    // 2. 過濾：只顯示 ALLOWED_VEHICLE_NAMES 中的載具
    const allowedSet = new Set(ALLOWED_VEHICLE_NAMES)
    const filtered = raw.filter(v => allowedSet.has(v.name))
    
    // 3. 取得未來的預訂資訊
    const { data: bookingsData } = await supabase
        .from('bookings')
        .select('id, vehicle_id, start_time, project_name')
        .in('vehicle_id', vehicleIds)
        .gte('start_time', now)
    
    // 4. 更新 state
    setVehicles(sorted.map(v => ({
        ...v,
        next_booking: nextByVehicle[v.id] || null,
    })))
}
```

**✅ 優點：**
- 每次 `fetchVehicles()` 都會從資料庫重新取得最新資料
- 包含載具資訊和下一筆預訂

**⚠️ 問題：**
- Dashboard **不會自動**刷新，需要手動觸發

---

### 2. EditVehicleModal.jsx 儲存流程

```javascript
// EditVehicleModal.jsx (第 40-83 行)

const handleSubmit = async (e) => {
    // 1. 儲存到資料庫
    const { data, error } = await supabase
        .from('vehicles')
        .upsert(payload)  // INSERT (新增) 或 UPDATE (更新)
        .select()
        .single()
    
    // 2. 記錄活動日誌
    await supabase.from('activities').insert({
        vehicle_id: data.id,
        user_id: user.id,
        action_type: 'status_change',
        content: isNew ? `Created vehicle ${data.name}` : `Updated vehicle details`
    })
    
    // 3. 關閉 Modal
    onClose()
    
    // 4. 🎯 關鍵：呼叫 onSave callback
    if (onSave) onSave()
}
```

**✅ 優點：**
- 有呼叫 `onSave()` callback
- 使用 `upsert()` 可以同時處理新增和更新

---

### 3. Dashboard 如何接收更新？

```javascript
// Dashboard.jsx (第 142-148 行)

{editingVehicle && (
    <EditVehicleModal
        vehicle={editingVehicle}
        onClose={() => setEditingVehicle(null)}
        onSave={fetchVehicles}  // 🎯 這裡！
    />
)}
```

**✅ 設計正確！**
- `onSave={fetchVehicles}` 代表：
  - 當 EditVehicleModal 儲存成功後
  - 會呼叫 `fetchVehicles()`
  - Dashboard 會重新從資料庫取得最新資料
  - 包含新增、更新、刪除的載具

---

## ✅ 目前設計的優點

### 1. **新增 Vehicle**
```
使用者點擊 "Add Vehicle" 
  ↓
EditVehicleModal 開啟（isNew = true）
  ↓
使用者填寫表單
  ↓
handleSubmit() → supabase.upsert() → INSERT
  ↓
onSave() 被呼叫
  ↓
Dashboard.fetchVehicles() 執行
  ↓
Dashboard 顯示新載具 ✅
```

### 2. **編輯 Vehicle**
```
使用者點擊 VehicleCard 的 "Edit" 按鈕
  ↓
EditVehicleModal 開啟（vehicle 有 id）
  ↓
使用者修改表單
  ↓
handleSubmit() → supabase.upsert() → UPDATE
  ↓
onSave() 被呼叫
  ↓
Dashboard.fetchVehicles() 執行
  ↓
Dashboard 顯示更新後的載具 ✅
```

### 3. **刪除 Vehicle**
⚠️ **目前尚未實作**（TODO-4.1 才會新增）

---

## ⚠️ 發現的問題

### 問題 1：過濾機制可能隱藏新增的載具

```javascript
// Dashboard.jsx (第 47-48 行)
const allowedSet = new Set(ALLOWED_VEHICLE_NAMES)
const filtered = raw.filter(v => allowedSet.has(v.name))
```

**ALLOWED_VEHICLE_NAMES 定義：**
```javascript
// constants.js
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

**⚠️ 問題：**
如果使用者在 EditVehicleModal 新增載具時：
- 輸入的名稱**不在** ALLOWED_VEHICLE_NAMES 中
- 載具會成功儲存到資料庫
- 但 Dashboard **不會顯示**這台載具
- 因為被過濾掉了！

**範例情境：**
```
1. Admin 開啟 "Add Vehicle"
2. 輸入名稱 "RD-999"（不在允許清單中）
3. 填寫其他欄位，點擊 "Create Vehicle"
4. ✅ 儲存成功（資料庫有這筆資料）
5. ❌ Dashboard 不顯示（被過濾掉）
6. 使用者困惑：「我的載具跑去哪了？」
```

---

### 問題 2：EditVehicleModal 允許自由輸入名稱

```javascript
// EditVehicleModal.jsx (第 109-118 行)
<div className="edit-form-group">
    <label>Vehicle Name</label>
    <input
        name="name"
        required
        value={formData.name}
        onChange={handleChange}
        placeholder="e.g. DQ-Alpha"  // ⚠️ 這個範例不在允許清單中！
    />
</div>
```

**⚠️ 問題：**
- 使用者可以輸入**任意**名稱
- 沒有驗證是否在 ALLOWED_VEHICLE_NAMES 中
- 與 Dashboard 的過濾邏輯不一致

---

### 問題 3：RLS 政策可能阻擋顯示

```javascript
// Dashboard.jsx (第 39-42 行)
const { data: vehiclesData, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false })
```

**潛在問題：**
- 如果 RLS 政策有 `deleted_at IS NULL` 條件（TODO-0.4 會加）
- 軟刪除的載具不會出現在查詢結果中 ✅
- 但目前沒有軟刪除功能，這個 OK

---

## 🎯 IMPLEMENTATION_PLAN 中的設計

讓我檢查 TODO-1.2 的計劃：

### TODO-1.2: Fix Vehicle Persistence Issue

**任務內容：**
```markdown
5. 將 vehicle name input 改為 DROPDOWN 而非自由文字：
<select name="name" value={formData.name} onChange={handleChange} required>
  <option value="">Select Vehicle</option>
  {ALLOWED_VEHICLE_NAMES.map(name => (
    <option key={name} value={name}>{name}</option>
  ))}
</select>
```

**✅ 這個設計解決了問題 1 和 2！**

---

## 📋 結論與建議

### ✅ 目前設計中已經正確的部分：

1. **資料流正確：**
   - EditVehicleModal 儲存後會呼叫 `onSave()`
   - Dashboard 會執行 `fetchVehicles()` 重新取得資料
   - 包含新增、更新、刪除（未來）

2. **前後端同步：**
   - 使用 Supabase `upsert()` 確保資料庫正確更新
   - Dashboard 直接從資料庫查詢，保證資料一致性

3. **即時更新：**
   - 不需要手動重新整理頁面
   - Modal 關閉後立即看到變更

---

### ⚠️ 需要修正的問題（在 TODO-1.2）：

**問題：** Vehicle Name 應該從 Dropdown 選擇，而非自由輸入

**原因：**
1. Dashboard 只顯示 ALLOWED_VEHICLE_NAMES 中的載具
2. 如果使用者輸入不在清單中的名稱，會造成混淆
3. 與 constants.js 的設計理念不一致

**解決方案（TODO-1.2）：**
```javascript
// 將自由文字 input 改為 dropdown
<select name="name" value={formData.name} onChange={handleChange} required>
  <option value="">Select Vehicle</option>
  {ALLOWED_VEHICLE_NAMES.map(name => (
    <option key={name} value={name}>{name}</option>
  ))}
</select>
```

**✅ 這樣可以確保：**
- 使用者只能選擇預定義的 7 個名稱
- 所有新增的載具都會顯示在 Dashboard 上
- 前後端邏輯一致

---

## 🎯 Phase 0 是否影響這個設計？

### TODO-0.2: 執行 Seven Vehicles SQL

**影響：**
- ✅ 確保資料庫中正好有 7 台載具
- ✅ 名稱與 ALLOWED_VEHICLE_NAMES 一致
- ✅ 為 TODO-1.2 打好基礎

### TODO-0.3: 移除 risk_level

**影響：**
- ⚠️ EditVehicleModal 目前有 `risk_level` 欄位（第 24, 53, 133-142 行）
- ⚠️ 移除資料庫欄位後，前端也需要更新
- ✅ TODO-1.3 會處理這個（移除 UI 欄位）

### TODO-0.4: 新增 deleted_at

**影響：**
- ✅ Dashboard 查詢會自動過濾軟刪除的載具（透過 RLS）
- ✅ 不需要修改前端程式碼

### TODO-0.5: 建立 change_logs

**影響：**
- ⚠️ EditVehicleModal 儲存時應該記錄到 change_logs
- ✅ TODO-3.2 會處理這個（新增 change logging）

---

## 📝 總結回答你的問題

### ❓ 新增/刪除 Vehicle 後，Dashboard 會自動更新數量嗎？

**✅ 會的！**
- EditVehicleModal 儲存後會呼叫 `onSave()`
- Dashboard 執行 `fetchVehicles()` 重新查詢資料庫
- 載具數量和內容會立即更新

**⚠️ 但有前提：**
- 載具名稱必須在 ALLOWED_VEHICLE_NAMES 中
- TODO-1.2 會強制使用 Dropdown，確保這個前提

---

### ❓ 編輯 Vehicle 內容後，Dashboard 和 DB 會跟著變動嗎？

**✅ 會的！**
1. **資料庫：** `supabase.upsert()` 立即更新
2. **Dashboard：** `fetchVehicles()` 重新查詢，顯示最新資料

**流程：**
```
編輯 → 儲存 → DB 更新 → onSave() → fetchVehicles() → Dashboard 刷新 ✅
```

---

### ❓ 前端和後端都有列入設計考量嗎？

**✅ 有的！設計是完整的：**

| 層面 | 設計狀態 | 說明 |
|------|---------|------|
| 後端（DB） | ✅ 完整 | 使用 Supabase upsert, RLS policies |
| 前端（UI） | ✅ 完整 | onSave callback 機制 |
| 資料同步 | ✅ 完整 | fetchVehicles() 重新查詢 |
| 即時更新 | ✅ 完整 | Modal 關閉後立即刷新 |

**⚠️ 需要修正：**
- TODO-1.2: 名稱改用 Dropdown（避免不一致）
- TODO-1.3: 移除前端的 risk_level 欄位
- TODO-3.2: 新增 change logging

---

## 🚀 建議執行順序

### Phase 0（資料庫準備）
1. ✅ TODO-0.1: 備份（已完成）
2. ⬜ TODO-0.2: 七台載具（確保資料一致）
3. ⬜ TODO-0.3: 移除 risk_level
4. ⬜ TODO-0.4: 新增 deleted_at
5. ⬜ TODO-0.5: 建立 change_logs

### Phase 1（修正 Bug）
6. ⬜ TODO-1.2: 將 name input 改為 dropdown ← **這個很重要！**
7. ⬜ TODO-1.3: 移除前端 risk_level UI

---

## ✅ 結論

**你的擔心是對的！** 👍

目前設計中確實有一個潛在問題：
- ❌ EditVehicleModal 允許自由輸入名稱
- ❌ Dashboard 只顯示允許清單中的名稱
- ⚠️ 可能造成「新增後看不到」的困惑

**但好消息是：**
- ✅ IMPLEMENTATION_PLAN 已經識別這個問題（TODO-1.2）
- ✅ 設計的修正方案是正確的（改用 Dropdown）
- ✅ Phase 0 會打好基礎，Phase 1 會修正這個問題

**建議：**
- 先完成 Phase 0（資料庫準備）
- 再做 TODO-1.2（修正名稱輸入方式）
- 這樣可以確保前後端完全一致 ✅

---

**你的思考非常細緻！繼續保持這種審慎的態度！** 🎯
