# LEARNcraft Telegram Mini App - Complete Deployment Guide

## 🚀 Quick Start: Deploy to Telegram Mini App

Your LEARNcraft website is now ready to be deployed as a Telegram Mini App! Follow these steps:

---

## **Step 1: Set Up Telegram Bot with BotFather**

1. **Open Telegram** and search for `@BotFather`
2. **Start a chat** and type `/start`
3. **Create a new bot** by typing `/newbot`
4. **Enter bot name**: `LEARNcraft` (or similar)
5. **Enter bot username**: `learncraft_bot` (must be unique and end with `_bot`)
6. **Copy your Bot Token** - looks like: `7950732190:AAGjT0DoRWwJuBsMpPy_2XFGc-VzvORdBKk`

---

## **Step 2: Deploy Your Website**

Choose ONE deployment option:

### **Option A: Vercel (Recommended - Easiest)**

1. **Go to** https://vercel.com/
2. **Sign in** with GitHub
3. **Import your repository**: `LEARNcraft-web`
4. **Deploy** - Vercel will auto-detect your settings
5. **Copy your Vercel URL** (e.g., `https://learncraft-web.vercel.app`)

### **Option B: GitHub Pages**

1. **Go to** GitHub Repository → Settings → Pages
2. **Select source**: `main` branch
3. **Your URL** will be: `https://mukhammadziyo554-netizen.github.io/LEARNcraft-web/`

### **Option C: Netlify**

1. **Go to** https://netlify.com/
2. **Connect GitHub** and select your repository
3. **Publish** - automatic deployment
4. **Copy your Netlify URL**

---

## **Step 3: Configure Mini App in BotFather**

1. **Send to @BotFather**: `/setmenubutton`
2. **Select your bot** from the list
3. **Choose**: "Web App"
4. **Button text**: `🎓 Open LEARNcraft`
5. **Web App URL**: Paste your deployed URL
   - Example: `https://learncraft-web.vercel.app/index.html`

---

## **Step 4: Configure Bot Commands**

Send these commands to @BotFather:

```
/setcommandscope
Select: Default
/setcommands

Use this list:
start - Start the bot
help - Show help information
ask - Ask AI a question
feedback - Send feedback
```

---

## **Step 5: Test Your Mini App**

1. **Find your bot** on Telegram (search `@learncraft_bot` or your username)
2. **Tap** the `/start` command or the menu button
3. **Tap** "🎓 Open LEARNcraft"
4. **Your web app should load!**

---

## **Step 6: Configure Webhook (Optional - For Production)**

For advanced setup with webhook integration:

1. **Update bot.py**: Replace `BOT_TOKEN` with your actual token
2. **Configure webhook**: Send to BotFather `/setwebhook`
3. **Webhook URL**: Your deployed app URL + `/webhook`

---

## **📋 Required File Structure**

Your deployment includes:
```
index.html              ← Main mini app page
style.css              ← Styling
auth.js               ← Authentication
progress.js           ← Progress tracking
webapp-init.js        ← Telegram WebApp initialization
bot.py                ← Telegram bot backend
```

---

## **🔧 Important Configuration**

### **In BotFather:**
- ✅ Set menu button to Web App
- ✅ Set inline button text to "Open LEARNcraft"
- ✅ Set Web App URL to your deployment

### **In bot.py:**
```python
BOT_TOKEN = 'YOUR_TOKEN_HERE'  # Get from BotFather
MINI_APP_URL = 'YOUR_DEPLOYED_URL/index.html'
```

---

## **📱 Mini App Features Enabled**

Your mini app now has access to:
- ✅ Telegram user information
- ✅ Haptic feedback (vibration)
- ✅ Full-screen expansion
- ✅ Telegram theme colors
- ✅ Data sharing with bot
- ✅ Phone number requests (with permission)

---

## **🎯 Recommended Deployment Setup**

**For Best Performance:**
1. **Use Vercel** (fastest, auto-deploys from GitHub)
2. **Configure DNS** (optional, for custom domain)
3. **Enable HTTPS** (automatically done by Vercel)
4. **Set Bot Commands** in BotFather
5. **Test thoroughly** on mobile before sharing

---

## **⚙️ Environment Variables**

If using environment variables, add to your deployment platform:

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add: `BOT_TOKEN` = your token
3. Redeploy

**Netlify:**
1. Go to Site Settings → Build & Deploy → Environment
2. Add: `BOT_TOKEN` = your token
3. Trigger redeploy

---

## **🐛 Troubleshooting**

### **Web App Won't Load**
- ❌ Check if HTTPS URL (not HTTP)
- ❌ Verify URL is correct in BotFather
- ❌ Clear Telegram cache: Settings → Storage

### **Telegram API Not Responding**
- ❌ Ensure `telegram-web-app.js` is loaded
- ❌ Check browser console for errors (Ctrl+Shift+I)
- ❌ Verify in actual Telegram app (not desktop)

### **Styles Not Loading**
- ❌ Check CORS settings on server
- ❌ Verify CSS file is in deployment
- ❌ Clear browser cache

---

## **📊 Testing Checklist**

Before sharing with users:
- [ ] Web app loads on mobile
- [ ] Dark/Light mode toggle works
- [ ] All navigation links work
- [ ] Pricing cards display correctly
- [ ] AI chat loads without errors
- [ ] User can scroll all sections
- [ ] Theme persists after refresh
- [ ] No console errors

---

## **🚀 Live Deployment Commands**

After initial setup, future deployments:

```bash
# Commit and push changes
git add -A
git commit -m "Update mini app"
git push origin main

# Vercel auto-deploys
# GitHub Pages auto-deploys
# Netlify auto-deploys
```

---

## **📞 Support**

Your bot is configured to handle:
- `/start` - Welcome message with mini app button
- `/help` - Help information
- `/ask` - AI tutoring
- `/feedback` - User feedback collection

---

## **✅ Next Steps**

1. ✅ Deploy to Vercel/GitHub Pages
2. ✅ Configure with BotFather
3. ✅ Test the mini app
4. ✅ Share with friends
5. ✅ Gather feedback and iterate

---

**Your LEARNcraft Mini App is ready to go live! 🎉**

For more help, visit:
- 📖 [Telegram Bot API Docs](https://core.telegram.org/bots/webapps)
- 📖 [Vercel Docs](https://vercel.com/docs)
- 📖 [GitHub Pages Docs](https://docs.github.com/en/pages)
