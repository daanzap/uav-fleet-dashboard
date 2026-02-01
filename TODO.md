# 🎯 DeltaQuad Fleet Manager - TODO List

> **Updated:** Feb 1, 2026  
> **Current Status:** OAuth deployment issues being resolved

---

## ✅ **已完成 (Completed)**

### 開發 (Development)
- ✅ 所有 PRD 功能實作完成
- ✅ Department-based RLS
- ✅ Soft Lock 衝突警告
- ✅ Hardware Snapshot (JSONB)
- ✅ 完整的 Booking Form
- ✅ Calendar Overview (ISO weeks)
- ✅ SSH Key 設定 (GitHub push)
- ✅ Vercel 自動部署設定
- ✅ GitHub Actions CI/CD (`.github/workflows/test.yml`)

### 部署 (Deployment)
- ✅ Vercel 專案連接
- ✅ Vercel 環境變數設定
- ✅ GitHub Pages 備用部署
- ✅ 動態 base path 支援 (Vercel + GitHub Pages)

### 文檔 (Documentation)
- ✅ `README.md` - 專案概述
- ✅ `PRD.md` - 產品需求文件
- ✅ `PROJECT_STATUS_FEB_1_2026.md` - 實作狀態
- ✅ `READY_TO_TEST.md` - 測試指南
- ✅ `TESTING.md` - 測試自動化計劃
- ✅ `docs/DATABASE_SETUP.md` - 資料庫遷移指南
- ✅ `docs/SPRINT_TO_DEMO.md` - Sprint 計劃
- ✅ `.cursorrules` - AI 開發規範

---

## 🔥 **緊急待辦 (Urgent - Today)**

### 1. 修正 OAuth 無限迴圈 🚨
**狀態:** 🟡 進行中  
**優先級:** P0 (Blocker)

- [x] 診斷問題 (401 錯誤)
- [x] 改善 AuthContext error handling
- [x] 加入 hash cleanup 邏輯
- [x] 改善 auth state 監聽
- [ ] **測試 Vercel 部署** (等待中)
- [ ] 確認登入流程正常

**測試步驟:**
```bash
# 1. 等待 Vercel 部署完成 (1-2 分鐘)
# 2. 清除瀏覽器快取
# 3. 無痕視窗訪問: https://uav-fleet-dashboard.vercel.app/
# 4. 測試 Google OAuth 登入
# 5. 檢查 Console 是否有錯誤
```

### 2. 執行資料庫遷移 🗄️
**狀態:** ⏳ 待執行  
**優先級:** P0 (Blocker)

- [ ] 取得 Supabase 資料庫密碼
- [ ] 在 `.env` 加入 `DATABASE_URL`
- [ ] 執行 `npm run db:migrate:all`
- [ ] 驗證遷移成功

```bash
# 在 Supabase SQL Editor 執行:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'vehicles', 'bookings')
AND column_name IN ('department', 'hw_config', 'risk_level', 'location');
```

---

## 📋 **本週待辦 (This Week)**

### 3. 本地測試 🧪
**狀態:** ⏳ 待執行  
**優先級:** P1  
**預估時間:** 30 分鐘

**測試清單:**
- [ ] 登入測試 (Google OAuth)
- [ ] 車輛列表顯示 (RLS 過濾)
- [ ] 建立 Booking (包含 Risk Level, Location)
- [ ] 衝突警告測試 (Soft Lock)
- [ ] 編輯車輛 (JSONB hw_config)
- [ ] Calendar Overview (ISO weeks, stacking)

```bash
npm run dev
# 訪問: http://localhost:5173/
```

### 4. 自動化測試 🤖
**狀態:** ⚠️ 部分完成  
**優先級:** P1  
**預估時間:** 1-2 小時

#### Unit Tests
- [x] 測試框架設定 (Vitest)
- [x] `src/lib/constants.test.js` (基本測試)
- [x] `src/lib/database.test.js` (資料庫工具)
- [ ] **補充測試覆蓋率**
  - [ ] AuthContext tests
  - [ ] BookingModal tests
  - [ ] VehicleCard tests
  - [ ] Calendar utils tests

```bash
npm run test:run  # 執行所有 unit tests
npm run test      # Watch mode
```

#### E2E Tests
- [x] Playwright 設定
- [x] `e2e/app.spec.js` (基本流程)
- [x] `e2e/dashboard.spec.js` (Dashboard 測試)
- [ ] **補充 E2E 測試**
  - [ ] OAuth 登入流程
  - [ ] Booking 建立流程
  - [ ] Calendar 互動測試
  - [ ] Department isolation 測試

```bash
npx playwright install  # 首次執行
npm run test:e2e        # 執行 E2E tests
```

#### CI/CD
- [x] GitHub Actions workflow (`.github/workflows/test.yml`)
- [ ] **修正 GitHub Secrets**
  - [ ] 在 GitHub repo 設定 `VITE_SUPABASE_URL`
  - [ ] 在 GitHub repo 設定 `VITE_SUPABASE_ANON_KEY`
  - [ ] 驗證 CI 測試通過

**設定步驟:**
1. 前往: https://github.com/Sachakafka/uav-fleet-dashboard/settings/secrets/actions
2. 點擊 "New repository secret"
3. 加入環境變數

### 5. 文檔補充 📚
**狀態:** ⏳ 待執行  
**優先級:** P2  
**預估時間:** 30 分鐘

- [ ] **更新 README.md**
  - [ ] 加入 Vercel 部署 URL
  - [ ] 加入測試指令說明
  - [ ] 加入 OAuth 設定步驟
  - [ ] 加入 Troubleshooting 章節

- [ ] **建立 CONTRIBUTING.md**
  - [ ] Git workflow (branch, commit, PR)
  - [ ] Code style guide
  - [ ] Testing requirements
  - [ ] Review process

- [ ] **建立 CHANGELOG.md**
  - [ ] v1.0.0 release notes
  - [ ] 功能清單
  - [ ] Breaking changes
  - [ ] Migration guide

---

## 🚀 **下週待辦 (Next Week)**

### 6. Staging 環境部署
**狀態:** ⏳ 待執行  
**優先級:** P1

- [ ] 建立 Staging Supabase 專案 (或使用 dev)
- [ ] 在 Staging 執行資料庫遷移
- [ ] 設定 Vercel Preview 環境
- [ ] 文檔化 Staging URL

### 7. UAT 測試 (User Acceptance Testing)
**狀態:** ⏳ 待執行  
**優先級:** P0

執行 PRD 的 4 個驗收測試:

**Test 1: Department Isolation**
- [ ] Marketing 用戶只能看到 Marketing 車輛

**Test 2: Shared Pool**
- [ ] R&D 用戶可以看到 Training 車輛

**Test 3: Hardware Snapshot**
- [ ] Booking 保存建立時的 hw_config

**Test 4: Soft Lock**
- [ ] 衝突警告顯示但不阻擋提交

### 8. Demo 準備
**狀態:** ⏳ 待執行  
**優先級:** P2

- [ ] 準備 2-3 個 user flow 示範
- [ ] 建立各部門的 demo 帳號
- [ ] 準備示範資料 (vehicles, bookings)
- [ ] 文檔化已知限制
- [ ] 打 Git tag: `v1.0.0-demo`

---

## 💡 **未來改進 (Future Enhancements)**

### 效能優化
- [ ] 實作 React Query (TanStack Query)
- [ ] 加入 loading states 和 skeleton screens
- [ ] 圖片優化 (lazy loading)
- [ ] Code splitting

### 功能增強
- [ ] 通知系統 (Booking 提醒)
- [ ] 匯出功能 (CSV, PDF)
- [ ] 進階搜尋和過濾
- [ ] 車輛維護記錄
- [ ] Dashboard analytics

### DevOps
- [ ] Docker 容器化
- [ ] Monitoring (Sentry, LogRocket)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Backup 策略

### 安全性
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] Input sanitization review
- [ ] Security audit

---

## 📊 **進度總覽**

| 類別 | 完成度 | 狀態 |
|------|--------|------|
| 核心功能開發 | 100% | ✅ 完成 |
| 資料庫遷移 | 0% | ⏳ 待執行 |
| 本地測試 | 0% | ⏳ 待執行 |
| 自動化測試 | 40% | 🟡 進行中 |
| 部署 (Vercel) | 90% | 🟡 OAuth 問題修正中 |
| 文檔 | 80% | 🟡 需補充 |
| UAT 測試 | 0% | ⏳ 待執行 |

---

## 🎯 **本日目標 (Today's Goals)**

1. ✅ 修正 OAuth 無限迴圈
2. ⏳ 執行資料庫遷移
3. ⏳ 完成本地測試

---

## 📞 **需要協助的事項**

1. **Supabase 資料庫密碼** - 需要執行遷移
2. **測試帳號** - 需要各部門的測試帳號 (R&D, Training, Marketing)
3. **Demo 資料** - 需要準備示範用的車輛和 booking 資料

---

**最後更新:** 2026-02-01 18:30 (GMT+8)
