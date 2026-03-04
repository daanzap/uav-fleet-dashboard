# Phase 0 ready to execute

**Note:** This archived document was originally in Chinese. For current English documentation see **HANDOVER.md** and **docs/00_README_DOCS_INDEX.md**.

---

**Status:** All scripts ready  
**Date:** 2026-02-06  
**Estimate:** 45 minutes

---

## Prep completed

**Migration scripts:**
- `db/09_remove_vehicles_risk_level.sql` (Task 8 - remove risk_level)
- `db/10_add_soft_delete.sql` (Task 9 - soft delete)
- `db/11_create_change_logs.sql` (Task 10 - audit table)
- `db/PHASE_0_RUN_ALL.sql` (run all in one go)


✅ **Documentation 已建立:**
- `PHASE_0_EXECUTION_CHECKLIST.md` (執行清單)
- `db/README_PHASE_0.md` (快速入門指南)

✅ **Git Commit 已完成:**
- Commit: `b2f260c`
- Message: "feat(db): Phase 0 - Database schema migration scripts"
- Files: 7 個檔案，1197 行新增

---

## 🎯 現在該做什麼

### 步驟 1: 開啟 Supabase SQL Editor

```
https://supabase.com/dashboard/project/citoiconzejdfjjefnbi/editor/sql
```

### 步驟 2: 選擇執行方式

#### 方式 A: 一次執行所有任務 (推薦) ⭐

```bash
# 在終端機查看腳本
cat db/PHASE_0_RUN_ALL.sql
```

然後:
1. 複製整個檔案內容
2. 貼到 Supabase SQL Editor
3. 點擊 "Run" 按鈕
4. 等待約 45 秒
5. 檢查輸出中的 ✅ 狀態訊息

**優點:**
- ✅ 原子性執行 (全部成功或全部失敗)
- ✅ 內建驗證步驟
- ✅ 清楚的成功/失敗指示器
- ✅ 最快速的執行方式

#### 方式 B: 逐步執行 (謹慎模式)

依序執行:
1. `db/09_remove_vehicles_risk_level.sql` (10 分鐘)
2. `db/10_add_soft_delete.sql` (15 分鐘)
3. `db/11_create_change_logs.sql` (20 分鐘)

**優點:**
- ✅ 完全控制每個步驟
- ✅ 可以在步驟間驗證
- ✅ 適合學習或除錯

### 步驟 3: 驗證執行結果

執行這些查詢確認成功:

```sql
-- 1. 確認 vehicles 無 risk_level，有 deleted_at
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- 2. 確認 bookings 有 risk_level，有 deleted_at
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- 3. 確認 change_logs 存在
SELECT COUNT(*) as exists 
FROM information_schema.tables 
WHERE table_name = 'change_logs';
-- 應該回傳 1

-- 4. 確認活躍載具數量
SELECT COUNT(*) as active_vehicles 
FROM vehicles 
WHERE deleted_at IS NULL;
-- 應該回傳 7
```

### 步驟 4: 測試前端

```bash
cd /Users/alexchang/DQ\ Fleet/uav-fleet-dashboard
npm run dev
```

檢查清單:
- [ ] Dashboard 正常顯示所有載具
- [ ] Console 無錯誤訊息
- [ ] 點擊 "Edit" 開啟編輯視窗
- [ ] 表單中無 "Risk Level" 欄位
- [ ] 可成功儲存修改
- [ ] 可成功建立新載具

### 步驟 5: 回報執行結果

執行完成後，更新狀態:
- 更新 `PHASE_0_EXECUTION_CHECKLIST.md` 中的進度表
- 標記任務狀態: ⬜ → ✅
- 記錄執行日期與執行者

---

## 📊 預期結果

### 資料庫變更

**vehicles 表:**
```
❌ risk_level (已移除)
✅ deleted_at (新增)
```

**bookings 表:**
```
✅ risk_level (保留)
✅ deleted_at (新增)
```

**change_logs 表:**
```
✅ 新建立的稽核表
✅ 包含 3 個索引
✅ 啟用 RLS 政策
```

### RLS 政策

```sql
-- vehicles 和 bookings 的 SELECT 政策更新為:
WHERE deleted_at IS NULL  -- 只顯示未刪除的記錄
```

---

## ⚠️ 重要注意事項

### 資料安全

- 🔴 **Task 8 是破壞性操作**: 移除 `vehicles.risk_level` 欄位無法復原
- 🔴 **執行前確認備份**: 確保資料庫有最新備份
- 🟡 **測試環境優先**: 如果可能，先在測試環境執行

### 執行時間

- ⏱️ **預留充足時間**: 整個過程約 45 分鐘
- ⏱️ **避免中斷**: 執行期間請勿關閉瀏覽器
- ⏱️ **檢查網路**: 確保穩定的網路連線

### 影響範圍

- 📊 **資料庫**: 結構變更，現有資料保留
- 💻 **前端**: 無需修改，已準備就緒
- 🔒 **RLS**: 政策更新，維持安全性

---

## 🐛 問題排解

### "column does not exist" 錯誤
**原因:** 嘗試刪除不存在的欄位  
**解法:** 腳本已使用 `IF EXISTS`，應不會發生

### "policy already exists" 錯誤
**原因:** 政策未先刪除就重建  
**解法:** 腳本已使用 `DROP POLICY IF EXISTS`，應不會發生

### 載具未顯示在 Dashboard
**原因:** RLS 政策依 department 過濾  
**解法:** 檢查使用者的 `department` 欄位

### 無法插入 change_logs
**原因:** RLS 阻擋未認證使用者  
**解法:** 確認已登入且非匿名使用者

---

## 📚 相關文件

- **執行指南:** `docs/02_PHASE_0_Execution_Guide.md` (詳細步驟)
- **快速入門:** `db/README_PHASE_0.md` (SQL 腳本說明)
- **總覽:** `docs/01_PHASE_0_Overview.md` (背景與目標)
- **檢查清單:** `PHASE_0_EXECUTION_CHECKLIST.md` (狀態追蹤)

---

## 🔜 完成後下一步

1. **Push Git Commit:** 
   ```bash
   git push origin main
   ```

2. **執行 Phase 1:** Bug Fixes (TODO-1.1 through TODO-1.4)
   - 修正預約時間衝突
   - 改善錯誤處理
   - 新增載入狀態
   - 優化 UX

3. **整合 change_logs:** 前端顯示變更歷史

4. **實作軟刪除 UI:** 還原已刪除項目功能

---

## ✨ 總結

所有準備工作已完成！現在可以安全地執行 Phase 0 資料庫遷移。

**建議執行時機:**
- ☀️ 工作日白天 (避免影響夜間使用)
- 🕐 預留完整 1 小時不受打擾
- ✅ 確認備份完成
- ✅ 團隊成員知悉維護時間

**執行者:** _______________  
**執行日期:** _______________  
**開始時間:** _______________  
**完成時間:** _______________  
**驗證結果:** _______________

---

**最後更新:** 2026 年 2 月 6 日  
**準備者:** DeltaQuad 開發團隊  
**狀態:** ✅ 準備就緒，可以執行
