# 🚨 立即修復 OAuth 無限迴圈 - 3 分鐘搞定

## ⚡ 第 1 步：Supabase Dashboard（最重要！）

1. 打開這個連結：
   ```
   https://app.supabase.com/project/citoiconzejdfjjefnbi/auth/url-configuration
   ```

2. 找到 **Redirect URLs** 區塊

3. 複製貼上這些 URLs（一次全部貼上，用換行分隔）：
   ```
   http://localhost:5173
   http://localhost:5173/
   https://uav-fleet-dashboard.vercel.app
   https://uav-fleet-dashboard.vercel.app/
   https://uav-fleet-dashboard-git-main-alexs-projects-043bd484.vercel.app
   https://uav-fleet-dashboard-git-main-alexs-projects-043bd484.vercel.app/
   ```

4. 點擊 **Save** 按鈕（非常重要！）

5. 確認 **Site URL** 是：
   ```
   https://uav-fleet-dashboard.vercel.app
   ```

## ⚡ 第 2 步：等待 Vercel 部署

程式碼已經推送，Vercel 會自動部署（約 1-2 分鐘）

查看部署狀態：
```
https://vercel.com/alexs-projects-043bd484/uav-fleet-dashboard
```

## ⚡ 第 3 步：測試

1. **清除瀏覽器資料**（重要！）
   - 按 F12 打開 DevTools
   - Application → Storage → Clear site data
   - 或使用無痕模式

2. **訪問你的網站**
   ```
   https://uav-fleet-dashboard.vercel.app
   ```

3. **點擊 "Sign in with Google"**

4. **應該成功登入！** 🎉

## ❌ 如果還是不行

### 檢查 1：Supabase Redirect URLs 是否保存成功？
- 重新打開 Supabase URL Configuration 頁面
- 確認所有 URLs 都在列表中
- 如果沒有，重新添加並**確實點擊 Save**

### 檢查 2：Vercel 部署是否完成？
- 打開 Vercel dashboard
- 確認最新的 commit `24e0573` 已經部署
- Status 應該是 "Ready"

### 檢查 3：瀏覽器 Console 有什麼錯誤？
- 按 F12 打開 DevTools
- 切換到 Console tab
- 截圖錯誤訊息給我看

## 📞 需要幫助？

如果上述步驟都完成了還是不行，請提供：
1. Supabase Redirect URLs 的截圖
2. Vercel 部署狀態的截圖
3. 瀏覽器 Console 的錯誤訊息

---

## 🔍 為什麼會這樣？

簡單來說：
1. Google OAuth 登入後會重定向回你的網站
2. Supabase 需要知道哪些 URLs 是允許的
3. 如果 URL 不在白名單中，就會一直重定向
4. 我們剛剛把 Vercel 的 URLs 加入白名單了

## ✅ 完成後的狀態

- ✅ 可以用 Google 登入
- ✅ 登入後停留在 Dashboard
- ✅ 重新整理頁面後仍保持登入
- ✅ 可以正常登出

加油！你快成功了！💪
