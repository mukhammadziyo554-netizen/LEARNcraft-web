# 🚀 LEARNcraft - AI-Powered Engineering Support

Your AI-powered engineering education platform with Telegram Mini App integration.

## ✨ Features

- 📚 **6 Engineering Fields**: Civil, Aerospace, Mechanical, Electrical, Nuclear, Chemical
- 🎓 **Structured Learning Roadmaps**: 5-step learning paths for each discipline
- 🌐 **Multi-language Support**: English, Russian, Uzbek
- 🤖 **Telegram Integration**: Mini App for seamless mobile experience
- 💬 **AI Chat**: Ask questions and get instant help
- 📱 **Responsive Design**: Works on all devices

## 🚀 Quick Deploy

### 1️⃣ Deploy Website (Vercel)
```bash
# Clone/Push to GitHub first
git remote add origin https://github.com/YOUR_USERNAME/LEARNcraft-web.git
git push -u origin main
```

Then go to **https://vercel.com** and:
- Click "New Project"
- Select your repository
- Click "Deploy"
- **Your site is live!** 🎉

### 2️⃣ Set Up Telegram Bot

Get your bot token:
1. Search **@BotFather** on Telegram
2. Send `/newbot`
3. Follow prompts
4. Copy your **BOT_TOKEN**

Edit `bot.py`:
```python
BOT_TOKEN = 'your_token_here'
MINI_APP_URL = 'https://your-vercel-url.app/index.html'
```

### 3️⃣ Run the Bot
```bash
pip install -r requirements.txt
python3 bot.py
```

### 4️⃣ Test in Telegram
- Search for your bot
- Send `/start`
- Click **"🚀 Open LEARNcraft App"**
- Done! 🎊

## 📂 Project Structure

```
learncraft-web/
├── index.html                    # Main page with roadmap sidebar
├── civil-engineering.html        # Civil Engineering roadmap
├── aerospace-engineering.html    # Aerospace Engineering roadmap
├── mechanical-engineering.html   # Mechanical Engineering roadmap
├── electrical-engineering.html   # Electrical Engineering roadmap
├── nuclear-engineering.html      # Nuclear Engineering roadmap
├── chemical-engineering.html     # Chemical Engineering roadmap
├── ask-ai.html                   # AI Chat interface
├── registration.html             # User registration
├── login.html                    # User login
├── admin.html                    # Admin panel
├── support.html                  # Support page
├── bot.py                        # Telegram bot
├── vercel.json                   # Vercel configuration
├── package.json                  # Project metadata
├── requirements.txt              # Python dependencies
├── DEPLOYMENT.md                 # Detailed deployment guide
└── README.md                     # This file
```

## 🎨 Colors & Design

- **Primary Gold**: #FFD700
- **Secondary Gold**: #D4AF37
- **Text Gold**: #C9A961
- **Dark Background**: Linear gradient (0% black → 100% #1a1a1a)

## 🔗 Links

- **GitHub**: [LEARNcraft-web](https://github.com/mukhammadziyo554-netizen/LEARNcraft-web)
- **Telegram Bot**: Search for your bot name
- **Vercel Dashboard**: [Dashboard](https://vercel.com/dashboard)

## 📝 License

MIT License - Feel free to use and modify!

## 👨‍💻 Author

Created by **Muhammadziyo** - 2026

---

**Need help?** Check `DEPLOYMENT.md` for detailed instructions!
