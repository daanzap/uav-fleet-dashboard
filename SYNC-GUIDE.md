# 同步指南 - 在家繼續工作

## ✅ 已完成的操作

**日期**: 2026年2月2日
**時間**: 下午

### 1. 程式碼已同步
- ✅ 已將本地變更提交到 Git
- ✅ 已備份原始變更到 `backup-local-changes` 分支
- ✅ 已與遠端 `origin/main` 同步
- ✅ 工作目錄乾淨，無未提交變更

### 2. 目前狀態
```
分支: main
最新提交: f7cfe5f - fix: add Supabase auth config for OAuth callback handling
與遠端狀態: 完全同步 ✅
```

---

## 🏠 在家裡電腦上的操作步驟

### Step 1: 克隆或拉取專案

#### 如果是第一次在家裡電腦工作：
```bash
# 克隆專案
git clone https://github.com/Sachakafka/uav-fleet-dashboard.git
cd uav-fleet-dashboard

# 安裝依賴
npm install
```

#### 如果已經有專案：
```bash
# 進入專案目錄
cd uav-fleet-dashboard

# 拉取最新變更
git pull origin main

# 更新依賴（如果 package.json 有變更）
npm install
```

### Step 2: 設定環境變數

確認 `.env` 檔案存在並包含正確的 Supabase 連線資訊：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: 啟動開發伺服器

```bash
npm run dev
```

專案會在 `http://localhost:5173` 啟動

---

## 📝 重要資訊

### 最新功能（遠端已有的變更）
根據最新的提交記錄，專案已包含：
- ✅ Supabase OAuth 認證配置
- ✅ Vercel 部署設定
- ✅ 詳細的錯誤除錯日誌
- ✅ 完整的測試和部署任務清單
- ✅ Playwright E2E 測試設定
- ✅ 資料庫遷移腳本
- ✅ 多個文件和指南

### 備份的本地變更
您的原始變更已保存在 `backup-local-changes` 分支，包含：
- 增強的預訂模態框（自訂飛行員輸入和暱稱支援）
- 日曆總覽模態框
- 個人檔案暱稱編輯功能
- 多個資料庫修復和文件

如果需要這些變更，可以在家裡的電腦上：
```bash
# 查看備份分支
git checkout backup-local-changes

# 或者將特定變更合併回 main
git checkout main
git cherry-pick <commit-hash>
```

---

## 🔧 故障排除

### 如果遇到依賴問題：
```bash
# 刪除 node_modules 和鎖定檔案
rm -rf node_modules package-lock.json

# 重新安裝
npm install
```

### 如果遇到 Git 衝突：
```bash
# 查看狀態
git status

# 放棄本地變更（如果不重要）
git reset --hard origin/main

# 或者儲藏變更
git stash
git pull origin main
git stash pop
```

---

## 📚 相關文件

專案中包含以下重要文件：
- `README.md` - 專案總覽
- `PRD.md` - 產品需求文件
- `TODO.md` - 待辦事項
- `TESTING.md` - 測試指南
- `docs/` 目錄 - 完整文件集合

---

## ✨ Cursor AI 同步說明

**重要**: Cursor 的 AI 對話記錄**不會**自動同步到其他電腦。

### 會同步的內容：
- ✅ 設定檔 (Settings)
- ✅ 擴充套件 (Extensions)
- ✅ 快捷鍵 (Keybindings)

### 不會同步的內容：
- ❌ AI 對話歷史
- ❌ 本地檔案（需要透過 Git 同步）

### 建議：
- 重要的 AI 對話內容，建議複製到文件中保存
- 使用 Git 提交訊息記錄重要的變更和決策

---

## 🎯 下次繼續工作時

1. 確認環境設定正確
2. 拉取最新變更: `git pull origin main`
3. 安裝/更新依賴: `npm install`
4. 啟動開發伺服器: `npm run dev`
5. 參考 `TODO.md` 和 `TESTING.md` 了解下一步工作

---

**祝工作順利！** 🚀
