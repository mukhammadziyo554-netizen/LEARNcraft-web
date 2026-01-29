import logging
from telegram import Update, BotCommand, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import Application, CommandHandler, ContextTypes

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Replace with your Telegram Bot Token
# Get it from @BotFather on Telegram
BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'  # ← REPLACE THIS with your token from @BotFather

# Your mini app URL - SET THIS TO YOUR ACTUAL DOMAIN after deployment
# Example: https://learncraft.yourwebsite.com or https://yourdomain.com/index.html
MINI_APP_URL = 'https://your-domain.com/index.html'

# Command handlers
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /start is issued."""
    user = update.effective_user
    
    # Welcome message
    welcome_text = f"Hi {user.mention_html()}! 👋\n\n" \
                   f"Welcome to LEARNcraft Bot! 🚀\n\n" \
                   f"I'm here to help you with engineering education.\n\n"
    
    # Command descriptions
    commands_text = "📋 *Available Commands:*\n\n" \
                   "• /start - Start the bot and see this welcome message\n" \
                   "• /help - Show detailed help and available features\n" \
                   "• /custom - Access custom features and tools\n\n" \
                   "Feel free to use any of these commands to explore what I can do! 😊\n\n" \
                   "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" \
                   "*📚 /help Command Details:*\n" \
                   "Use /help to get:\n" \
                   "✅ Complete list of available commands\n" \
                   "✅ Information about each feature\n" \
                   "✅ Support options and contact info\n\n" \
                   "*🎯 /custom Command Details:*\n" \
                   "Use /custom to access:\n" \
                   "📖 View Engineering Courses\n" \
                   "💡 Ask AI for Help\n" \
                   "📝 Submit Feedback\n" \
                   "🔧 Check System Status\n\n" \
                   "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    full_message = welcome_text + commands_text
    
    # Create inline keyboard with mini app button
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Open LEARNcraft App",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )],
        [InlineKeyboardButton(
            text="📚 Get Help",
            callback_data="show_help"
        )],
        [InlineKeyboardButton(
            text="🎯 Custom Features",
            callback_data="show_custom"
        )]
    ])
    
    await update.message.reply_html(full_message, reply_markup=keyboard)

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /help is issued."""
    help_text = "📚 *Available Commands:*\n\n" \
                "/start - Start the bot and see a welcome message\n" \
                "/help - Show this help message\n" \
                "/custom - Access custom features and tools\n\n" \
                "*Need support?* Visit our support page or contact us directly!"
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Open LEARNcraft App",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )]
    ])
    
    await update.message.reply_text(help_text, parse_mode='Markdown', reply_markup=keyboard)

async def custom_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /custom is issued."""
    custom_text = "🎯 *Custom Features:*\n\n" \
                  "Here you can access custom features for LEARNcraft:\n\n" \
                  "• 📖 View Engineering Courses\n" \
                  "• 💡 Ask AI for Help\n" \
                  "• 📝 Submit Feedback\n" \
                  "• 🔧 Check System Status\n\n" \
                  "What would you like to do?"
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Open LEARNcraft App",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )]
    ])
    
    await update.message.reply_text(custom_text, parse_mode='Markdown', reply_markup=keyboard)

def main() -> None:
    """Start the bot."""
    # Create the Application
    application = Application.builder().token(BOT_TOKEN).build()

    # on different commands - answer in Telegram
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("custom", custom_command))

    # Run the bot until the user presses Ctrl-C
    application.run_polling()

if __name__ == '__main__':
    main()
