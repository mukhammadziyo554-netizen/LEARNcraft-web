import logging
import re
from telegram import Update, BotCommand, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, ContextTypes, filters

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Engineering knowledge base
ENGINEERING_KNOWLEDGE = {
    'civil': {
        'topics': ['structures', 'concrete', 'steel', 'soil mechanics', 'hydraulics', 'transportation', 'surveying'],
        'formulas': {
            'stress': 'σ = F/A (Force divided by Area)',
            'strain': 'ε = ΔL/L (Change in length divided by original length)',
            'moment': 'M = F × d (Force multiplied by distance)'
        }
    },
    'mechanical': {
        'topics': ['thermodynamics', 'fluid mechanics', 'mechanics', 'heat transfer', 'machine design', 'dynamics'],
        'formulas': {
            'force': 'F = ma (Force equals mass times acceleration)',
            'power': 'P = W/t (Power equals work divided by time)',
            'efficiency': 'η = (Output/Input) × 100%'
        }
    },
    'electrical': {
        'topics': ['circuits', 'power systems', 'electronics', 'signals', 'control systems', 'electromagnetics'],
        'formulas': {
            'ohms law': 'V = IR (Voltage equals current times resistance)',
            'power': 'P = VI (Power equals voltage times current)',
            'resistance': 'R = ρL/A (Resistance based on resistivity, length, area)'
        }
    },
    'chemical': {
        'topics': ['reactions', 'thermodynamics', 'mass transfer', 'process design', 'kinetics', 'separation'],
        'formulas': {
            'ideal gas': 'PV = nRT',
            'reaction rate': 'rate = k[A]^n',
            'mass balance': 'Input - Output + Generation - Consumption = Accumulation'
        }
    }
}

STUDY_GUIDANCE = {
    'beginner': {
        'advice': 'Start with fundamentals: mathematics (calculus, algebra), physics, and basic engineering principles.',
        'resources': ['Khan Academy', 'MIT OpenCourseWare', 'Coursera Engineering courses'],
        'timeline': '6-12 months for foundational knowledge'
    },
    'intermediate': {
        'advice': 'Focus on core engineering courses, hands-on projects, and practical applications.',
        'resources': ['Engineering textbooks', 'Online labs', 'Industry case studies'],
        'timeline': '1-2 years for specialization'
    },
    'advanced': {
        'advice': 'Pursue specialized topics, research papers, and real-world projects.',
        'resources': ['Research journals', 'Advanced courses', 'Industry collaborations'],
        'timeline': '2+ years for mastery'
    }
}

# Replace with your Telegram Bot Token
# Get it from @BotFather on Telegram
BOT_TOKEN = '7950732190:AAGjT0DoRWwJuBsMpPy_2XFGc-VzvORdBKk'  # ← REPLACE THIS with your token from @BotFather

# Your mini app URL - GitHub Pages deployment
# GitHub Pages URL: https://mukhammadziyo554-netizen.github.io/LEARNcraft-web/
MINI_APP_URL = 'https://mukhammadziyo554-netizen.github.io/LEARNcraft-web/index.html'

# Admin group/chat ID where feedback will be sent (example: -1001234567890)
ADMIN_CHAT_ID = -1003644858128

FEEDBACK_PROMPT = (
    "📝 *Send Feedback*\n\n"
    "Please type your message and send it here. "
    "Your feedback will go directly to our admin team."
)

FEEDBACK_THANKS = (
    "✅ Thanks for your feedback! Our administrators will reach out to you soon."
)

def build_help_text() -> str:
    return "📚 *LEARNcraft Bot - Help Center*\n\n" \
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
           "*/ask* - Ask AI engineering questions\n" \
           "  • Get instant answers to engineering questions\n" \
           "  • Learn formulas and concepts\n" \
           "  • Study guidance and career advice\n\n" \
           "*/custom* - Access advanced features\n" \
           "  • View engineering courses\n" \
           "  • Access specialized tools\n" \
           "  • Submit feedback\n" \
           "  • Check system status\n\n" \
           "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" \
           "🤖 *AI Assistant Features:*\n\n" \
           "Just type your question naturally and I'll help with:\n" \
           "• 📐 Engineering formulas (stress, power, Ohm's law, etc.)\n" \
           "• 📚 Study plans and learning paths\n" \
           "• 🎓 Career guidance in engineering\n" \
           "• 🔧 Specific topics in Civil, Mechanical, Electrical, Chemical Engineering\n\n" \
           "Examples:\n" \
           "• 'How do I calculate stress?'\n" \
           "• 'What should I study to become an engineer?'\n" \
           "• 'Explain Ohm's law'\n" \
           "• 'Tell me about mechanical engineering'\n\n" \
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

def build_custom_text() -> str:
    return "🎯 *Custom Features & Advanced Tools*\n\n" \
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
        )],
        [InlineKeyboardButton(
            text="📝 Send Feedback",
            callback_data="start_feedback"
        )]
    ])
    
    await update.message.reply_text(welcome_text, parse_mode='Markdown', reply_markup=keyboard)

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /help is issued."""
    help_text = build_help_text()
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Open LEARNcraft App",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )],
        [InlineKeyboardButton(
            text="📝 Send Feedback",
            callback_data="start_feedback"
        )]
    ])
    
    await update.message.reply_text(help_text, parse_mode='Markdown', reply_markup=keyboard)

async def custom_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /custom is issued."""
    custom_text = build_custom_text()
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Open LEARNcraft App",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )],
        [InlineKeyboardButton(
            text="📝 Send Feedback",
            callback_data="start_feedback"
        )]
    ])
    
    await update.message.reply_text(custom_text, parse_mode='Markdown', reply_markup=keyboard)

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    if query.data == "show_help":
        text = build_help_text()
    elif query.data == "show_custom":
        text = build_custom_text()
    elif query.data == "start_feedback":
        context.user_data["awaiting_feedback"] = True
        text = FEEDBACK_PROMPT
    else:
        text = "Unknown action. Please use /start, /help, or /custom."

    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Open LEARNcraft App",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )]
    ])

    if query.message:
        await query.message.reply_text(text, parse_mode='Markdown', reply_markup=keyboard)

async def feedback_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    context.user_data["awaiting_feedback"] = True
    await update.message.reply_text(FEEDBACK_PROMPT, parse_mode='Markdown')

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    # If awaiting feedback, process the feedback
    if context.user_data.get("awaiting_feedback"):
        context.user_data["awaiting_feedback"] = False
        user = update.effective_user
        message = update.message.text

        if ADMIN_CHAT_ID == -1000000000000:
            await update.message.reply_text(
                "⚠️ Admin chat ID is not configured yet.\n"
                "Add the bot to your admin group and run /chatid in that group, then update ADMIN_CHAT_ID."
            )
            return

        admin_text = (
            "📩 *New Feedback*\n\n"
            f"👤 User: {user.full_name} (@{user.username or 'no-username'})\n"
            f"🆔 ID: {user.id}\n\n"
            f"💬 Message:\n{message}"
        )

        await context.bot.send_message(chat_id=ADMIN_CHAT_ID, text=admin_text, parse_mode='Markdown')
        await update.message.reply_text(FEEDBACK_THANKS)
        return

    # AI-powered question answering
    message_text = update.message.text.lower()
    response = generate_ai_response(message_text)
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Open LEARNcraft App",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )],
        [InlineKeyboardButton(
            text="📚 Get More Help",
            callback_data="show_help"
        )],
        [InlineKeyboardButton(
            text="📝 Send Feedback",
            callback_data="start_feedback"
        )]
    ])
    
    await update.message.reply_text(response, parse_mode='Markdown', reply_markup=keyboard)

def generate_ai_response(message: str) -> str:
    """Generate intelligent responses based on message content."""
    
    # Check if asking about studying or learning
    if any(word in message for word in ['how to study', 'what to study', 'where to start', 'learning path', 'roadmap']):
        return generate_study_guidance(message)
    
    # Check if asking about specific engineering field
    for field in ENGINEERING_KNOWLEDGE.keys():
        if field in message:
            return generate_engineering_answer(field, message)
    
    # Check if asking about formulas
    if any(word in message for word in ['formula', 'equation', 'calculate', 'computation']):
        return generate_formula_help(message)
    
    # Check if asking about career or education
    if any(word in message for word in ['career', 'job', 'salary', 'university', 'degree']):
        return generate_career_guidance(message)
    
    # Check if greeting
    if any(word in message for word in ['hello', 'hi', 'hey', 'greetings']):
        return (
            "👋 Hello! I'm your AI engineering assistant.\n\n"
            "I can help you with:\n"
            "• Engineering concepts and formulas\n"
            "• Study guidance and learning paths\n"
            "• Career advice in engineering\n"
            "• Specific questions about Civil, Mechanical, Electrical, or Chemical Engineering\n\n"
            "What would you like to know?"
        )
    
    # Default intelligent response
    return (
        "🤖 *AI Assistant*\n\n"
        "I'm here to help with engineering questions!\n\n"
        "You can ask me about:\n"
        "• 📐 Engineering formulas and calculations\n"
        "• 📚 Study plans and learning paths\n"
        "• 🎓 Career guidance in engineering\n"
        "• 🔧 Specific topics in Civil, Mechanical, Electrical, or Chemical Engineering\n\n"
        "Examples:\n"
        "• 'How do I calculate stress in a beam?'\n"
        "• 'What should I study to become a mechanical engineer?'\n"
        "• 'Explain Ohm's law'\n\n"
        "Or use /help to see all available commands!"
    )

def generate_study_guidance(message: str) -> str:
    """Generate personalized study guidance."""
    
    level = 'beginner'
    if 'advanced' in message or 'expert' in message:
        level = 'advanced'
    elif 'intermediate' in message or 'some experience' in message:
        level = 'intermediate'
    
    guidance = STUDY_GUIDANCE[level]
    
    return (
        f"📚 *Study Guidance - {level.capitalize()} Level*\n\n"
        f"💡 *Recommendation:*\n{guidance['advice']}\n\n"
        f"📖 *Suggested Resources:*\n"
        + "\n".join([f"• {resource}" for resource in guidance['resources']]) +
        f"\n\n⏱ *Typical Timeline:*\n{guidance['timeline']}\n\n"
        f"🎯 *Next Steps:*\n"
        f"1. Start with foundational mathematics\n"
        f"2. Learn core engineering principles\n"
        f"3. Practice with real problems\n"
        f"4. Work on hands-on projects\n\n"
        f"Need specific guidance for a field? Ask about Civil, Mechanical, Electrical, or Chemical Engineering!"
    )

def generate_engineering_answer(field: str, message: str) -> str:
    """Generate engineering-specific answers."""
    
    field_data = ENGINEERING_KNOWLEDGE[field]
    field_name = field.capitalize()
    
    # Check if asking about specific formula
    for formula_name, formula_text in field_data['formulas'].items():
        if formula_name in message:
            return (
                f"📐 *{field_name} Engineering Formula*\n\n"
                f"**{formula_name.title()}:**\n"
                f"`{formula_text}`\n\n"
                f"💡 *Application:*\n"
                f"This formula is fundamental in {field_name} Engineering calculations.\n\n"
                f"Need more examples or explanations? Just ask!"
            )
    
    # General field information
    return (
        f"🔧 *{field_name} Engineering*\n\n"
        f"📚 *Key Topics:*\n"
        + "\n".join([f"• {topic.title()}" for topic in field_data['topics']]) +
        f"\n\n📐 *Important Formulas:*\n"
        + "\n".join([f"• **{name.title()}:** `{formula}`" for name, formula in field_data['formulas'].items()]) +
        f"\n\n💡 Want to learn more about a specific topic? Ask me about it!"
    )

def generate_formula_help(message: str) -> str:
    """Generate help for formula-related questions."""
    
    # Check common formulas across fields
    formulas_found = []
    
    for field, data in ENGINEERING_KNOWLEDGE.items():
        for formula_name, formula_text in data['formulas'].items():
            if any(word in message for word in formula_name.split()):
                formulas_found.append((field, formula_name, formula_text))
    
    if formulas_found:
        response = "📐 *Engineering Formulas*\n\n"
        for field, name, formula in formulas_found:
            response += f"**{name.title()}** ({field.capitalize()}):\n`{formula}`\n\n"
        response += "Need step-by-step explanation? Just ask!"
        return response
    
    return (
        "📐 *Formula Help*\n\n"
        "I can help you with engineering formulas!\n\n"
        "Available formulas by field:\n"
        "• **Civil:** Stress, Strain, Moment\n"
        "• **Mechanical:** Force, Power, Efficiency\n"
        "• **Electrical:** Ohm's Law, Power, Resistance\n"
        "• **Chemical:** Ideal Gas, Reaction Rate, Mass Balance\n\n"
        "Ask me about a specific formula!"
    )

def generate_career_guidance(message: str) -> str:
    """Generate career-related guidance."""
    
    return (
        "💼 *Engineering Career Guidance*\n\n"
        "🎓 *Education Path:*\n"
        "1. Bachelor's degree (4 years)\n"
        "2. Internships and co-ops\n"
        "3. Professional Engineer (PE) license (optional)\n"
        "4. Master's/PhD for advanced roles (optional)\n\n"
        "💰 *Career Prospects:*\n"
        "• Strong job growth in most engineering fields\n"
        "• Competitive salaries ($60k-$120k+ depending on experience)\n"
        "• Opportunities in various industries\n\n"
        "🏢 *Common Sectors:*\n"
        "• Manufacturing & Production\n"
        "• Energy & Utilities\n"
        "• Consulting & Design\n"
        "• Research & Development\n"
        "• Technology & Software\n\n"
        "Want specific advice about a field? Ask me about Civil, Mechanical, Electrical, or Chemical Engineering careers!"
    )

async def chatid_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat = update.effective_chat
    await update.message.reply_text(f"Chat ID: {chat.id}")

async def ask_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /ask command for direct AI questions."""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Open LEARNcraft App",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )]
    ])
    
    await update.message.reply_text(
        "🤖 *Ask AI Assistant*\n\n"
        "I'm ready to answer your engineering questions!\n\n"
        "You can ask me:\n"
        "• Engineering formulas and calculations\n"
        "• Study guidance and learning paths\n"
        "• Career advice\n"
        "• Specific topics in Civil, Mechanical, Electrical, or Chemical Engineering\n\n"
        "Just type your question and I'll help you! 💡",
        parse_mode='Markdown',
        reply_markup=keyboard
    )

def main() -> None:
    """Start the bot."""
    # Create the Application
    application = Application.builder().token(BOT_TOKEN).build()

    # on different commands - answer in Telegram
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("custom", custom_command))
    application.add_handler(CommandHandler("feedback", feedback_command))
    application.add_handler(CommandHandler("ask", ask_command))
    application.add_handler(CommandHandler("chatid", chatid_command))
    application.add_handler(CallbackQueryHandler(button_callback))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    # Run the bot until the user presses Ctrl-C
    application.run_polling()

if __name__ == '__main__':
    main()
