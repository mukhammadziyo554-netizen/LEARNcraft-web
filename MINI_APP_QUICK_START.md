# 🚀 TELEGRAM MINI APP - QUICK DEPLOYMENT REFERENCE

## ⚡ 5-Minute Setup

### Step 1: Get Bot Token
1. Open Telegram → Search `@BotFather`
2. Type `/newbot`
3. Name: `LEARNcraft` | Username: `learncraft_bot`
4. **Copy your token** (keep it safe!)

### Step 2: Deploy Website
1. Go to https://vercel.com
2. Click "Import Git Repository"
3. Select `LEARNcraft-web`
4. Click "Deploy"
5. **Copy your Vercel URL** (e.g., `https://learncraft-web.vercel.app`)

### Step 3: Configure Bot
1. Go back to @BotFather
2. Send: `/setmenubutton`
3. Select your bot
4. Choose: "Web App"
5. Button text: `🎓 Open LEARNcraft`
6. Web App URL: `https://learncraft-web.vercel.app/index.html`

### Step 4: Test
1. Find your bot on Telegram
2. Tap the menu button or `/start` command
3. Click "🎓 Open LEARNcraft"
4. ✅ App should load!

---

## 🌐 Deployment Options

| Option | Speed | Cost | Setup |
|--------|-------|------|-------|
| **Vercel** | ⚡ Fastest | Free | Auto |
| **GitHub Pages** | ⚡ Fast | Free | Manual |
| **Netlify** | ⚡ Fast | Free | Auto |
| **Custom Server** | Depends | Paid | Advanced |

### Vercel (Recommended)
```
1. vercel.com → Import repo
2. Deploy (automatic)
3. Copy URL
```

### GitHub Pages
```
1. Settings → Pages
2. Select main branch
3. Wait 1-2 min
4. URL: https://[username].github.io/LEARNcraft-web/
```

### Netlify
```
1. netlify.com → Connect GitHub
2. Select repo
3. Deploy
4. Copy URL
```

---

## 📝 Important URLs

### Your Mini App Files:
- **Web App URL**: `https://your-domain.com/index.html`
- **Asset CSS**: `https://your-domain.com/style.css`
- **Scripts**: `https://your-domain.com/auth.js`

### Bot Configuration:
- **Bot Token**: Get from @BotFather
- **Mini App URL**: Paste above in @BotFather settings
- **Menu Button**: Set to Web App type

---

## 🔐 Bot Token Security

⚠️ **IMPORTANT**: Never share your bot token!

Safe storage:
- ✅ Environment variables on Vercel/Netlify
- ✅ `.env` file (add to .gitignore)
- ❌ Don't commit to GitHub publicly
- ❌ Don't share in chats/groups

In `bot.py`:
```python
BOT_TOKEN = '7950732190:AAGjT0DoRWwJuBsMpPy_2XFGc-VzvORdBKk'
MINI_APP_URL = 'https://your-domain.com/index.html'
```

---

## ✅ Deployment Checklist

- [ ] Bot created with @BotFather
- [ ] Website deployed (Vercel/GitHub Pages/Netlify)
- [ ] HTTPS URL working (not HTTP)
- [ ] Menu button configured in @BotFather
- [ ] Web App URL set correctly
- [ ] Mini app loads on Telegram mobile
- [ ] All features working (dark mode, AI chat, pricing)
- [ ] Theme persists after refresh

---

## 🧪 Testing

### On Your Desktop:
```bash
# Local testing
python3 -m http.server 8000
# Visit http://localhost:8000
```

### On Telegram Mobile:
1. Find your bot
2. Tap menu button
3. Should open in full screen
4. All buttons should work

---

## 📱 User Experience

Your mini app provides:
- ✅ Full screen web app
- ✅ Telegram theme colors (dark/light)
- ✅ Haptic feedback (vibration)
- ✅ User info integration
- ✅ Smooth navigation
- ✅ Fast loading (<2 sec)
- ✅ Mobile optimized

---

## 🎯 Features Enabled

- 🎓 Engineering courses
- 🤖 AI tutor integration
- 💬 Real-time chat
- 📊 Progress tracking
- 🌙 Dark/Light mode
- 📱 Responsive design
- 🎨 Beautiful UI

---

## 🚨 If Something Goes Wrong

### Web app won't load?
- Check HTTPS (not HTTP)
- Verify URL in @BotFather
- Check browser console for errors
- Clear Telegram cache

### Styles look wrong?
- Hard refresh (Ctrl+Shift+R)
- Check CSS file deployed
- Verify no CORS issues

### Bot not responding?
- Check bot token is correct
- Verify bot is enabled
- Check @BotFather settings

---

## 📊 Monitoring

Check your deployment status:
- **Vercel**: https://vercel.com/dashboard
- **GitHub Pages**: Repository → Deployments
- **Netlify**: https://app.netlify.com

---

## 🎉 Success Criteria

Your mini app is ready when:
1. ✅ Web app loads in Telegram
2. ✅ All navigation works
3. ✅ Pricing displays correctly
4. ✅ AI chat is functional
5. ✅ Dark/light mode toggles
6. ✅ No console errors
7. ✅ Fast loading (< 3 seconds)

---

## 📞 Next Steps

1. Deploy to Vercel
2. Configure with @BotFather
3. Test thoroughly on mobile
4. Share with friends
5. Gather feedback
6. Make improvements
7. Celebrate! 🎉

---

## 🔗 Useful Resources

- [Telegram Bot API](https://core.telegram.org/bots)
- [Web Apps Documentation](https://core.telegram.org/bots/webapps)
- [Vercel Docs](https://vercel.com/docs)
- [GitHub Pages](https://pages.github.com/)

---

**Your LEARNcraft Mini App is live and ready for users!** 🚀
