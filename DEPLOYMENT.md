# LEARNcraft - Deployment Guide

## Quick Start - Deploy on Vercel (Free)

### Step 1: Prepare Your Code
✅ Your code is ready! All HTML, CSS, and JS files are in place.

### Step 2: Push to GitHub
```bash
cd /Users/mukhammadziyoazamkhonov/my-website

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/LEARNcraft-web.git
git push -u origin main
```

### Step 3: Deploy to Vercel
1. Go to **https://vercel.com**
2. Click "Sign Up" → Choose "GitHub"
3. Authorize Vercel to access your GitHub
4. Click "New Project"
5. Select your `LEARNcraft-web` repository
6. Click "Deploy"
7. **Your site is now LIVE!** 🎉

Your URL will be: `https://learncraft-web.vercel.app` (or similar)

---

## Step 4: Set Up Telegram Bot

### Get Bot Token
1. Open **Telegram** app
2. Search for **@BotFather**
3. Send `/newbot`
4. Follow prompts to create your bot
5. Copy your **BOT_TOKEN** (looks like: `123456:ABC-DEF1234ghIkl...`)

### Update bot.py
Edit `bot.py` and replace:
```python
BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'
MINI_APP_URL = 'https://your-domain.com/index.html'
```

With:
```python
BOT_TOKEN = '123456:ABC-DEF1234ghIkl...'  # Your actual token
MINI_APP_URL = 'https://learncraft-web.vercel.app/index.html'  # Your Vercel URL
```

### Run the Bot
```bash
# Install dependencies
pip install -r requirements.txt

# Run the bot
python3 bot.py
```

---

## Step 5: Test Your Telegram Mini App

1. Open **Telegram** app
2. Search for your bot (created with @BotFather)
3. Send `/start`
4. Click the button **"🚀 Open LEARNcraft App"**
5. Your website opens in Telegram! 🎊

---

## Deployment Diagram

```
GitHub Repository
        ↓
    Vercel (Hosts your HTML/CSS/JS)
        ↓
  learncraft-web.vercel.app
        ↓
   Telegram Mini App Button
        ↓
   User opens app in Telegram!
```

---

## Environment Variables (Optional - For Production)

Create a `.env` file:
```
BOT_TOKEN=your_token_here
MINI_APP_URL=https://learncraft-web.vercel.app/index.html
```

Then update `bot.py` to read from `.env`:
```python
import os
from dotenv import load_dotenv

load_dotenv()
BOT_TOKEN = os.getenv('BOT_TOKEN')
MINI_APP_URL = os.getenv('MINI_APP_URL')
```

---

## Troubleshooting

### Bot doesn't respond
- ✅ Check your BOT_TOKEN is correct
- ✅ Make sure bot.py is running: `python3 bot.py`
- ✅ Check internet connection

### Mini App doesn't load
- ✅ Verify your MINI_APP_URL is correct
- ✅ Check Vercel deployment is successful
- ✅ Test URL directly in browser

### Can't see "Open App" button
- ✅ Send `/start` command to your bot again
- ✅ Make sure WebAppInfo is correctly formatted in code

---

## Support

For issues:
- 📧 Check your bot token at @BotFather
- 🌐 Verify Vercel deployment at https://vercel.com/dashboard
- 📱 Test on Telegram Web: https://web.telegram.org

Happy coding! 🚀
