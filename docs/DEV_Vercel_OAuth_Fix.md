# Vercel OAuth 無限迴圈修復指南

## 問題描述
部署到 Vercel 後，Google OAuth 登入會出現無限迴圈，一直重定向到登入頁面。

## 根本原因
Supabase 的 OAuth redirect URL 沒有正確配置，導致 OAuth callback 無法正確處理。

## 修復步驟

### 1. 在 Supabase Dashboard 中添加 Redirect URLs

1. 登入 [Supabase Dashboard](https://app.supabase.com)
2. 選擇你的專案
3. 前往 **Authentication** → **URL Configuration**
4. 在 **Redirect URLs** 區域，添加以下 URLs：

```
http://localhost:5173
http://localhost:5173/
https://uav-fleet-dashboard.vercel.app
https://uav-fleet-dashboard.vercel.app/
https://uav-fleet-dashboard-git-main-alexs-projects-043bd484.vercel.app
https://uav-fleet-dashboard-git-main-alexs-projects-043bd484.vercel.app/
```

5. 點擊 **Save**

### 2. 確認 Site URL 設定

在同一頁面中，確認 **Site URL** 設定為：
```
https://uav-fleet-dashboard.vercel.app
```

### 3. 檢查 Google OAuth 設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 選擇你的專案
3. 前往 **APIs & Services** → **Credentials**
4. 找到你的 OAuth 2.0 Client ID
5. 在 **Authorized redirect URIs** 中添加：

```
https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
```

替換 `[YOUR-PROJECT-REF]` 為你的 Supabase 專案 reference ID（可以在 Supabase URL 中找到）

### 4. 重新部署到 Vercel

```bash
git add .
git commit -m "fix: improve OAuth redirect handling"
git push origin main
```

## 程式碼修改說明

### AuthContext.jsx 的改進

1. **簡化 redirectTo URL**
   - 使用 `window.location.origin` 而不是複雜的 baseUrl 計算
   - 確保在所有環境中都能正確工作

2. **改進 Auth State 處理**
   - 添加 `mounted` flag 防止 race condition
   - 在成功登入後清除 URL hash
   - 只在錯誤時清除 hash，避免過早清除

3. **更好的錯誤處理**
   - 只在 hash 包含 `error` 時才清除
   - 添加更多 console.log 用於調試

## 驗證修復

1. 清除瀏覽器 cookies 和 localStorage
2. 訪問 https://uav-fleet-dashboard.vercel.app
3. 點擊 "Sign in with Google"
4. 應該能成功登入並重定向到 dashboard

## 常見問題

### Q: 還是出現無限迴圈怎麼辦？
A: 
1. 確認 Supabase Redirect URLs 已正確添加並保存
2. 清除瀏覽器 cache 和 cookies
3. 檢查瀏覽器 Console 的錯誤訊息
4. 確認 Vercel 環境變數 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 正確設定

### Q: 本地開發正常但 Vercel 不行？
A: 確認 Vercel 的環境變數已正確設定，並且 Supabase Redirect URLs 包含 Vercel 的 URL

### Q: 如何查看 OAuth 錯誤？
A: 打開瀏覽器開發者工具的 Console，查看 `Auth event:` 和 `Auth session error:` 的訊息

## 相關文件

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase OAuth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
