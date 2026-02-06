# OAuth 設定檢查清單 ✅

## 🔴 立即執行（最重要！）

### 1. Supabase Dashboard 設定

前往: https://app.supabase.com/project/citoiconzejdfjjefnbi/auth/url-configuration

#### A. Redirect URLs (必須添加所有這些)
```
http://localhost:5173
http://localhost:5173/
https://uav-fleet-dashboard.vercel.app
https://uav-fleet-dashboard.vercel.app/
https://uav-fleet-dashboard-git-main-alexs-projects-043bd484.vercel.app
https://uav-fleet-dashboard-git-main-alexs-projects-043bd484.vercel.app/
```

#### B. Site URL
```
https://uav-fleet-dashboard.vercel.app
```

### 2. Google Cloud Console 設定

前往: https://console.cloud.google.com/apis/credentials

找到你的 OAuth 2.0 Client ID，在 **Authorized redirect URIs** 添加：

```
https://citoiconzejdfjjefnbi.supabase.co/auth/v1/callback
```

### 3. Vercel 環境變數檢查

前往: https://vercel.com/alexs-projects-043bd484/uav-fleet-dashboard/settings/environment-variables

確認以下變數存在：

```
VITE_SUPABASE_URL=https://citoiconzejdfjjefnbi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdG9pY29uemVqZGZqamVmbmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDQ5MTgsImV4cCI6MjA4MzI4MDkxOH0.E6vv3ZRILj9v4x7-g0CZI1mKMB-SaFzfrfiqc48ftfw
```

## 🟡 完成後測試步驟

1. **清除瀏覽器資料**
   - 打開 Chrome DevTools (F12)
   - Application → Storage → Clear site data
   - 或使用無痕模式

2. **訪問 Vercel URL**
   ```
   https://uav-fleet-dashboard.vercel.app
   ```

3. **點擊 "Sign in with Google"**
   - 應該跳轉到 Google 登入頁面
   - 選擇帳號後應該回到你的 app
   - 應該看到 Dashboard 而不是登入頁面

4. **檢查 Console**
   - 打開 DevTools Console
   - 應該看到:
     ```
     Initiating Google OAuth with redirect: https://uav-fleet-dashboard.vercel.app
     Auth event: SIGNED_IN Session: true
     Initial session check: true
     User logged in, redirecting to dashboard
     ```

## 🟢 如果還是不行

### Debug 步驟

1. **檢查 URL hash**
   - 登入後 URL 是否有 `#error` 或 `#access_token`
   - 如果有 `#error`，記下錯誤訊息

2. **檢查 Network tab**
   - 看是否有 `/auth/v1/token` 的請求
   - 檢查 response 是否有錯誤

3. **檢查 Supabase Logs**
   - 前往 Supabase Dashboard → Logs → Auth Logs
   - 查看是否有錯誤訊息

### 常見錯誤

| 錯誤訊息 | 原因 | 解決方法 |
|---------|------|---------|
| `redirect_uri_mismatch` | Redirect URL 不匹配 | 檢查 Supabase 和 Google Console 的 redirect URLs |
| `invalid_request` | OAuth 配置錯誤 | 重新檢查 Google OAuth 設定 |
| `access_denied` | 使用者取消登入 | 正常行為，重新登入即可 |
| 無限迴圈 | Redirect URL 未設定 | 確認 Supabase Redirect URLs 已保存 |

## 📝 完成後確認

- [ ] Supabase Redirect URLs 已添加並保存
- [ ] Supabase Site URL 已設定
- [ ] Google Cloud Console Redirect URI 已添加
- [ ] Vercel 環境變數正確
- [ ] 已清除瀏覽器 cache
- [ ] 測試登入成功
- [ ] 測試登出成功
- [ ] 測試重新整理頁面後仍保持登入狀態

## 🚀 部署新版本

完成上述設定後，推送程式碼更新：

```bash
git add .
git commit -m "fix: improve OAuth redirect handling and prevent infinite loop"
git push origin main
```

等待 Vercel 自動部署完成（約 1-2 分鐘）。
