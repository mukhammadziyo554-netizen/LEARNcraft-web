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

# Your mini app URL - GitHub Pages deployment
# GitHub Pages URL: https://mukhammadziyo554-netizen.github.io/LEARNcraft-web/
MINI_APP_URL = 'https://mukhammadziyo554-netizen.github.io/LEARNcraft-web/index.html'

# Command handlers
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /start is issued."""
    user = update.effective_user
    
    # Welcome message with full bot explanation
    welcome_text = f"👋 Hi {user.mention_html()}!\n\n" \
                   f"🚀 *Welcome to LEARNcraft Bot!*\n\n" \
                   f"I'm your personal assistant for engineering education. " \
                   f"This bot helps you explore different engineering fields, " \
                   f"access learning roadmaps, and get educational resources.\n\n" \
                   f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" \
                   f"🤖 *How This Bot Works:*\n\n" \
                   f"1️⃣ Use the *🚀 Open LEARNcraft App* button below to launch the full web application\n" \
                   f"2️⃣ Type commands (listed below) to access specific features\n" \
                   f"3️⃣ Navigate through engineering fields, learning roadmaps, and resources\n" \
                   f"4️⃣ Get AI-powered assistance for your engineering questions\n\n" \
                   f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" \
                   f"📋 *Available Commands:*\n\n" \
                   f"• */start* - Show this welcome message and bot instructions\n" \
                   f"• */help* - Get detailed help and support information\n" \
                   f"• */custom* - Access custom features and advanced tools\n\n" \
                   f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" \
                   f"📚 *What /help Does:*\n" \
                   f"✅ Shows complete command list\n" \
                   f"✅ Provides feature descriptions\n" \
                   f"✅ Offers support and contact options\n\n" \
                   f"🎯 *What /custom Does:*\n" \
                   f"✅ View Engineering Courses (Civil, Aerospace, Mechanical, etc.)\n" \
                   f"✅ Ask AI for personalized help\n" \
                   f"✅ Submit feedback and suggestions\n" \
                   f"✅ Check system status and updates\n\n" \
                   f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" \
                   f"💡 *Quick Start:*\n" \
                   f"Click the *🚀 Open LEARNcraft App* button below to get started!\n"
    
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
    help_text = "📚 *LEARNcraft Bot - Help Center*\n\n" \
                "Here's everything you need to know about using this bot:\n\n" \
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" \
                "🎯 *Available Commands:*\n\n" \
                "*/start* - Display welcome message with bot instructions\n" \
                "  • Shows how the bot works\n" \
                "  • Lists all available commands\n" \
                "  • Explains each feature\n\n" \
                "*/help* - Show this detailed help message\n" \
                "  • Command descriptions\n" \
                "  • Support information\n" \
                "  • Contact details\n\n" \
                "*/custom* - Access advanced features\n" \
                "  • View engineering courses\n" \
                "  • Ask AI for help\n" \
                "  • Submit feedback\n" \
                "  • Check system status\n\n" \
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" \
                "🌐 *LEARNcraft Web App Features:*\n\n" \
                "• 6 Engineering Fields (Civil, Aerospace, Mechanical, Electrical, Nuclear, Chemical)\n" \
                "• Learning Roadmaps with step-by-step guides\n" \
                "• Multi-language support (English, Russian, Uzbek)\n" \
                "• AI-powered assistance\n" \
                "• Educational resources and articles\n\n" \
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" \
                "💬 *Need Support?*\n" \
                "Visit our support page or contact us directly for assistance!"
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Open LEARNcraft App",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )]
    ])
    
    await update.message.reply_text(help_text, parse_mode='Markdown', reply_markup=keyboard)

async def custom_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /custom is issued."""
    custom_text = "🎯 *Custom Features & Advanced Tools*\n\n" \
                  "Access specialized features designed to enhance your learning experience:\n\n" \
                  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" \
                  "📖 *View Engineering Courses*\n" \
                  "Browse through 6 major engineering fields:\n" \
                  "• Civil Engineering - Infrastructure and construction\n" \
                  "• Aerospace Engineering - Aviation and space technology\n" \
                  "• Mechanical Engineering - Machines and systems\n" \
                  "• Electrical Engineering - Power and electronics\n" \
                  "• Nuclear Engineering - Nuclear technology\n" \
                  "• Chemical Engineering - Chemical processes\n\n" \
                  "💡 *Ask AI for Help*\n" \
                  "Get instant answers to your engineering questions with AI-powered assistance\n\n" \
                  "📝 *Submit Feedback*\n" \
                  "Help us improve by sharing your suggestions and feedback\n\n" \
                  "🔧 *Check System Status*\n" \
                  "View current system status and latest updates\n\n" \
                  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" \
                  "Click *🚀 Open LEARNcraft App* below to access all features!"
    
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
