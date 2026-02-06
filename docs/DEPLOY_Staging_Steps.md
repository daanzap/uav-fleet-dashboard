# Staging 部署步驟（Vercel / Netlify）

照此順序完成：**Staging 部署 → Staging UAT 簽核 → 打 tag 並從 tag 部署 production**。  
Rollback = 重新部署上一個 tag。

---

## 1. 實際做 Staging 部署

在 **Vercel** 或 **Netlify** 連此 repo 建立專案，設定環境變數，部署後取得 Staging URL。

### 1.1 Vercel

1. 登入 [vercel.com](https://vercel.com) → **Add New** → **Project**。
2. **Import** 此 Git repo（GitHub/GitLab/Bitbucket）。
3. **Configure Project**  
   - **Framework Preset:** Vite  
   - **Build Command:** `npm run build`  
   - **Output Directory:** `dist`  
   - **Root Directory:** 留空（或專案根目錄）
4. **Environment Variables**（必填）  
   - `VITE_SUPABASE_URL` = 你的 Supabase **Project URL**（API Settings）  
   - `VITE_SUPABASE_ANON_KEY` = Supabase **anon** key（API Settings）
5. **Deploy**。完成後得到 Staging URL，例如 `https://uav-fleet-dashboard-xxx.vercel.app`。

### 1.2 Netlify

1. 登入 [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**。
2. 連線此 Git repo。
3. **Build settings**（已由 `netlify.toml` 提供，可確認）  
   - **Build command:** `npm run build`  
   - **Publish directory:** `dist`
4. **Site settings** → **Environment variables** → **Add variable**  
   - `VITE_SUPABASE_URL`  
   - `VITE_SUPABASE_ANON_KEY`
5. **Deploy site**。完成後得到 Staging URL。

### 1.3 注意

- Staging 可先用**同一個 Supabase 專案**（開發用），或另建 Staging 專案。
- 部署後請確認：打開 Staging URL → 能登入、能看見車輛列表。

---

## 2. Staging UAT（PRD §5）

在 **Staging URL** 上跑以下四項，**四項都過**再往下。

| # | 項目 | 說明 |
|---|------|------|
| 1 | **Isolation** | 用 Marketing 帳號登入 → 只看得到 Marketing 車，看不到 R&D/Training 車。 |
| 2 | **Shared Pool** | 用 R&D 帳號登入 → 看得到 Training 車，且可預約。 |
| 3 | **Snapshot** | 改 Vehicle A 的 battery 為 "Battery-Old" → 建立預約 X → 再改 Vehicle A 為 "Battery-New" → 檢視預約 X，應顯示 "Battery-Old"。 |
| 4 | **Conflict** | 對同一車輛、重疊時段建立預約 → 出現警告，但仍可送出且預約成功。 |

**簽核表：** 使用 `docs/UAT_SIGN_OFF_SUNDAY.md` 打勾。  
**全部通過** = Staging UAT 簽核完成，可進行正式發布。

---

## 3. 正式發布（打 tag、從 tag 部署 production）

**不要用 branch 直接 deploy production。** 一律用 tag 部署。

### 3.1 打 tag 並 push

```bash
# 在 main 上（或 release 分支）打 tag
git tag v1.0.0

# 推送 tag 到遠端
git push origin v1.0.0
```

### 3.2 用該 tag 做 production 部署

- **Vercel：** Project → **Settings** → **Git**：Production Branch 可改為 `none`，改為從 **Deploy Hook** 或手動 **Deploy** 選擇 **tag v1.0.0**；或另建一個 Production 專案，只連 tag 觸發部署。  
  實務上常見：Production 綁 `main`，但**只合併已通過 UAT 且打過 tag 的 commit**；或使用 Vercel 的 **Promote to Production** 從 Staging 的某次 deploy（對應 tag 的 commit）提升。
- **Netlify：** 在 **Site settings** → **Build & deploy** → **Continuous Deployment**：Production branch 可設為 `main`；要從 tag 部署時，在 **Deploys** 選 **Trigger deploy** → **Deploy site**，或於 **Build settings** 指定 branch/tag。  
  若要用 tag：可設 **Production branch** 為 `main`，發布時先 `git checkout v1.0.0 && git push origin main`（不建議改歷史）；較單純做法是 **Production branch = main**，發布流程為：UAT 過 → 打 tag `v1.0.0` → 將該 tag 對應的 commit 合併進 `main` → 由 `main` 觸發 production 部署。這樣「production 永遠是某個 tag 對應的版本」。

**建議流程（最簡單）：**

1. UAT 通過後，在要上線的 commit 上打 tag：`git tag v1.0.0`，`git push origin v1.0.0`。
2. 若 Production 綁的是 `main`：確保該 commit 已在 `main` 上（例如已 merge），則該次 push 或 tag push 後會自動部署；**Production 的 deploy 即為該 tag 的程式版本**。
3. 若平台支援「Deploy from tag」：在 Vercel/Netlify 後台選擇由 tag `v1.0.0` 觸發一次 production build，則 production = 該 tag。

### 3.3 Rollback

- **做法：** 重新部署**上一個 tag**（例如目前 production 是 `v1.0.0`，rollback = 部署 `v0.9.0`）。
- 在 Vercel/Netlify 後台找到對應該 tag 的 deploy，設為 **Production**，或重新觸發一次以該 tag 為來源的部署。

---

## 4. 可選：E2E 全部綠燈

目前有 4 個 E2E 在未設定認證時會 **skip**（`e2e/dashboard.spec.js` 的 authenticated 測試）。

- **若要本地全部綠燈：** 在 `.env` 設定  
  `E2E_AUTH_EMAIL`、`E2E_AUTH_PASSWORD`（可登入的測試帳號），再執行 `npm run test:e2e`。
- **若要 CI 也跑這 4 個：** 在 GitHub **Settings → Secrets** 新增 `E2E_AUTH_EMAIL`、`E2E_AUTH_PASSWORD`，並在 `.github/workflows/test.yml` 的 `e2e` job 的 `env` 中傳入這兩個變數。  
詳見 `TESTING.md` 與 `.env.example`。

---

**一句話總結：** Staging 部署 → Staging UAT 簽核 → 打 tag 並從 tag 部署 production；Rollback = 重新部署上一個 tag。
