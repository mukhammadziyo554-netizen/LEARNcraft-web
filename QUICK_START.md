# 🎯 LEARNcraft Deployment - Complete Setup

## ✅ What's Ready

Your project is **100% ready to deploy**! Here's what I've set up:

### 📁 New Files Created:
- ✅ `vercel.json` - Vercel deployment configuration
- ✅ `package.json` - Project metadata
- ✅ `.gitignore` - Git ignore rules
- ✅ `.env.example` - Environment variables template
- ✅ `requirements.txt` - Python dependencies
- ✅ `DEPLOYMENT.md` - Detailed deployment guide
- ✅ `DEPLOY_README.md` - Quick start guide
- ✅ `setup.sh` - Automatic setup script

### 🎨 Website Features:
- ✅ Main page with vertical roadmap sidebar (1-6)
- ✅ 6 engineering fields with learning roadmaps
- ✅ Multi-language support (EN, RU, UZ)
- ✅ Responsive mobile design
- ✅ Telegram Mini App integration
- ✅ All CSS/styling fixed

---

## 🚀 DEPLOYMENT STEPS (Copy & Paste)

### Step 1: Push to GitHub
```bash
cd /Users/mukhammadziyoazamkhonov/my-website

git add .
git commit -m "Setup deployment configuration"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/LEARNcraft-web.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to **https://vercel.com/signup**
2. Click "Sign Up with GitHub"
3. Authorize Vercel
4. Click "New Project"
5. Select `LEARNcraft-web` repository
6. **Click "Deploy"**
7. **Your site is LIVE!** 🎉

**Your URL will be:** `https://learncraft-web.vercel.app`

### Step 3: Get Telegram Bot Token
1. Open Telegram
2. Search for **@BotFather**
3. Send `/newbot`
4. Choose a name (e.g., "LEARNcraft Bot")
5. Choose a username (e.g., "learncraft_bot")
6. **Copy your TOKEN** (save it safely!)

### Step 4: Update bot.py
Edit `/Users/mukhammadziyoazamkhonov/my-website/bot.py`:

Find these lines (around line 12-15):
```python
BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'
MINI_APP_URL = 'https://your-domain.com/index.html'
```

Replace with:
```python
BOT_TOKEN = '1234567890:ABCDefGhIjKlMnOpQrStUvWxYz'  # Your token from @BotFather
MINI_APP_URL = 'https://learncraft-web.vercel.app/index.html'  # Your Vercel URL
```

### Step 5: Run the Bot
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the bot
python3 bot.py
```

The bot will start running! You should see:
```
INFO:telegram.ext._application:Application started
```

### Step 6: Test in Telegram
1. Open Telegram
2. Search for your bot (the username you created)
3. Click "Start"
4. Send `/start`
5. **Click "🚀 Open LEARNcraft App"**
6. Your website opens in Telegram! 🎊

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   GITHUB REPOSITORY                      │
│  (Your code: HTML, CSS, JS, bot.py, config files)      │
└────────────┬────────────────────────────────────────────┘
             │ (Connected via Vercel)
             ↓
┌─────────────────────────────────────────────────────────┐
│                VERCEL (Web Server)                       │
│         Hosts: index.html, CSS, JS, all pages           │
│  URL: https://learncraft-web.vercel.app               │
└─────────────────────────────────────────────────────────┘
             ↑
             │ (Links to)
             │
┌─────────────────────────────────────────────────────────┐
│            YOUR LOCAL MACHINE                            │
│         Running: python3 bot.py                         │
│    Telegram Bot listens for user messages               │
│    Sends Mini App button with Vercel URL               │
└─────────────────────────────────────────────────────────┘
             ↑
             │
┌─────────────────────────────────────────────────────────┐
│          TELEGRAM (User Mobile App)                      │
│    User clicks button → Opens Vercel website in app     │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Notes

- Never share your BOT_TOKEN
- Keep `.env` file private (it's in `.gitignore`)
- Use environment variables in production

---

## ❓ Troubleshooting

### Bot not responding?
```bash
# Check if bot is running
python3 bot.py

# Check Python is installed
python3 --version

# Check dependencies are installed
pip install -r requirements.txt
```

### Website not loading?
- Visit: `https://learncraft-web.vercel.app`
- Check Vercel dashboard: `https://vercel.com/dashboard`
- Check if deployment succeeded

### Mini App button not showing?
- Send `/start` to bot again
- Check BOT_TOKEN is correct in bot.py
- Make sure bot.py is running

---

## 📝 File Locations

```
/Users/mukhammadziyoazamkhonov/my-website/
├── bot.py .................... Telegram bot (UPDATE WITH YOUR TOKEN!)
├── index.html ................ Main page (auto-deployed)
├── *-engineering.html ........ Engineering pages (auto-deployed)
├── vercel.json ............... Deployment config (ready!)
├── package.json .............. Project info (ready!)
├── requirements.txt .......... Python deps (ready!)
└── DEPLOYMENT.md ............. Full deployment guide
```

---

## ✨ What Happens Next

1. ✅ You deploy to Vercel (automatic)
2. ✅ Website is live on the internet
3. ✅ Your bot runs on your machine
4. ✅ Users click button in Telegram
5. ✅ App opens in Telegram Mini App
6. ✅ Users explore engineering fields
7. ✅ Perfect! 🎉

---

## 🎓 Learning Resources

- Vercel: https://vercel.com/docs
- Telegram Bot API: https://core.telegram.org/bots/api
- Mini App Docs: https://core.telegram.org/bots/webapps

---

## 📞 Next Steps

1. Follow the 6 deployment steps above ⬆️
2. Test in Telegram
3. Celebrate! 🎊

**Everything is configured. You just need to run the deployment!**

Good luck! 🚀
