import logging
import re
import random
from datetime import datetime
from telegram import Update, BotCommand, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, ContextTypes, filters

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# ============ DAILY LEARNING TIPS ============
DAILY_TIPS = [
    "💡 *Tip of the Day: Stress vs Strain*\nStress is the FORCE applied, Strain is the DEFORMATION caused. Remember: Stress = cause, Strain = effect!",
    "🔍 *Quick Fact: Hooke's Law*\nStress is directly proportional to strain: σ = E × ε (where E is Young's modulus)",
    "⚙️ *Mechanical Insight*\nEfficiency = (Useful Output / Total Input) × 100%. Always less than 100% due to friction and heat loss!",
    "⚡ *Electrical Truth*\nOhm's Law: V = I × R. If voltage increases and resistance stays same, current increases proportionally.",
    "🌊 *Civil Engineering*\nBeam deflection depends on: Load, span length, material rigidity, and support type. More flexible materials = more deflection!",
    "🔬 *Chemistry Note*\nIdeal Gas Law: PV = nRT. At constant volume, if temperature increases, pressure increases (used in pressure vessels!).",
    "🏗️ *Construction Wisdom*\nConcrete strength depends on water-cement ratio. Too much water = weak concrete. The correct ratio is critical!",
    "⚙️ *Power Calculation*\nP = F × v (Power = Force × Velocity). Or P = W/t. Higher velocity with same force = higher power output!",
    "🌡️ *Heat Transfer*\nQ = m × c × ΔT. To heat 1kg of water by 1°C needs 4186 Joules (specific heat capacity of water)",
    "🔌 *Electrical Power*\nP = V × I = I²R. More current or higher voltage = more power. Power dissipation creates heat (transformer losses!)",
]

# ============ QUICK LESSONS (MICRO-LEARNING) ============
QUICK_LESSONS = {
    'stress': {
        'title': '📐 Understanding Stress',
        'content': '*Definition:* Force per unit area (σ = F/A)\n\n'
                   '*Types:*\n'
                   '1. *Tensile Stress* - pulling/stretching force\n'
                   '2. *Compressive Stress* - pushing/squeezing force\n'
                   '3. *Shear Stress* - parallel/sliding force\n\n'
                   '*Real Example:*\n'
                   'A steel cable holding weight: The more weight you hang, the more STRESS on the cable!\n\n'
                   '*Formula:* σ = F/A (Stress = Force ÷ Area)\n'
                   '*Unit:* Pascals (Pa) or N/m²'
    },
    'strain': {
        'title': '📏 Understanding Strain',
        'content': '*Definition:* Deformation or displacement as a percentage (ε = ΔL/L)\n\n'
                   '*Key Points:*\n'
                   '• Strain is DIMENSIONLESS (no units!)\n'
                   '• Expressed as decimal or percentage\n'
                   '• Shows how much material DEFORMS\n\n'
                   '*Example:*\n'
                   'A 1-meter steel bar stretches 0.01m under load:\n'
                   'Strain = 0.01/1 = 0.01 = 1% elongation\n\n'
                   '*Three Types:*\n'
                   '1. Normal strain (lengthening/shortening)\n'
                   '2. Shear strain (angular change)\n'
                   '3. Volumetric strain (volume change)'
    },
    'beam': {
        'title': '🏗️ Beam Types Explained',
        'content': '*Beams* are horizontal structural members supporting loads\n\n'
                   '*Common Types:*\n\n'
                   '1️⃣ *Simply Supported*\n'
                   '   - Supported at two ends\n'
                   '   - Maximum deflection at center\n'
                   '   - Most common in buildings\n\n'
                   '2️⃣ *Cantilever*\n'
                   '   - Fixed at ONE end\n'
                   '   - Free at other end\n'
                   '   - Used for balconies\n\n'
                   '3️⃣ *Continuous*\n'
                   '   - Supported at 3+ points\n'
                   '   - Less deflection\n'
                   '   - Used for long spans\n\n'
                   '*Pro Tip:* Shorter beams with less load = less deflection!'
    },
    'circuit': {
        'title': '⚡ Basic Electric Circuits',
        'content': '*A circuit* is a complete path for electricity to flow\n\n'
                   '*Essential Components:*\n\n'
                   '🔋 *Power Source* - provides energy (battery, power plant)\n'
                   '🔌 *Conductor* - carries current (copper wire)\n'
                   '💡 *Load* - uses the electricity (lamp, motor)\n'
                   '⏯️ *Switch* - controls the flow\n\n'
                   '*Two Types:*\n\n'
                   '*Series Circuit:*\n'
                   '- Components in line, same current everywhere\n'
                   '- One break = whole circuit stops\n\n'
                   '*Parallel Circuit:*\n'
                   '- Components in separate branches\n'
                   '- Each has its own path\n'
                   '- Better for homes (one light off ≠ all lights off!)'
    },
    'force': {
        'title': '⚙️ Force and Motion',
        'content': '*Newton\'s Second Law:* F = ma (Force = Mass × Acceleration)\n\n'
                   '*Understanding Force:*\n'
                   '• Force makes things move or change direction\n'
                   '• Measured in Newtons (N)\n'
                   '• 1 Newton = force to accelerate 1kg at 1m/s²\n\n'
                   '*Real Examples:*\n'
                   '🚗 Car with same engine (force) pulls harder with less mass\n'
                   '📦 Heavy box needs more force to move than light box\n'
                   '⚽ Kicking ball harder = higher acceleration\n\n'
                   '*Pro Tip:* More mass = need more force for same acceleration!'
    },
    'power': {
        'title': '⚡ Power Explained',
        'content': '*Power* = How FAST work is done\n\n'
                   '*Two Formulas:*\n\n'
                   '1️⃣ P = W/t (Power = Work ÷ Time)\n'
                   '2️⃣ P = F × v (Power = Force × Velocity)\n\n'
                   '*Unit:* Watts (W) = Joules per second\n\n'
                   '*Real Examples:*\n'
                   '💪 Two people lift same weight:\n'
                   '   - Person A: takes 2 seconds\n'
                   '   - Person B: takes 5 seconds\n'
                   '   Person A = MORE POWER!\n\n'
                   '⚡ 100W light bulb uses 100 Joules every second\n'
                   '🏃 Running fast = high power, Walking = low power'
    },
}

# ============ ENGINEERING QUIZZES ============
ENGINEERING_QUIZZES = {
    'quiz_1': {
        'question': '❓ *Quiz Question 1*\n\nWhat does "σ" represent in engineering?\n\na) Strain\nb) Stress\nc) Strength\nd) Stretch',
        'answer': 'b) Stress',
        'explanation': '✅ Correct! σ (sigma) represents STRESS (force per unit area). Remember: σ = F/A'
    },
    'quiz_2': {
        'question': '❓ *Quiz Question 2*\n\nIn Ohm\'s Law (V = IR), if I increase voltage while keeping resistance constant, what happens to current?\n\na) Decreases\nb) Stays same\nc) Increases\nd) Becomes zero',
        'answer': 'c) Increases',
        'explanation': '✅ Correct! Current is directly proportional to voltage. V↑ = I↑ (V and I are proportional!)'
    },
    'quiz_3': {
        'question': '❓ *Quiz Question 3*\n\nWhich beam type has maximum deflection when loaded in the middle?\n\na) Cantilever\nb) Simply supported\nc) Continuous\nd) Fixed-fixed',
        'answer': 'b) Simply supported',
        'explanation': '✅ Correct! Simply supported beams have maximum deflection at center. Other types have supports reducing deflection!'
    },
    'quiz_4': {
        'question': '❓ *Quiz Question 4*\n\nIf you do 200 Joules of work in 5 seconds, what is the power?\n\na) 25 W\nb) 40 W\nc) 200 W\nd) 1000 W',
        'answer': 'b) 40 W',
        'explanation': '✅ Correct! P = W/t = 200J ÷ 5s = 40 Watts. Remember: Power = Work divided by Time!'
    },
    'quiz_5': {
        'question': '❓ *Quiz Question 5*\n\nWhich factor DOES NOT affect beam deflection?\n\na) Load amount\nb) Beam length\nc) Material color\nd) Support type',
        'answer': 'c) Material color',
        'explanation': '✅ Correct! Material COLOR has no effect. Load, length, rigidity, and supports DO affect deflection!'
    },
}

# ============ PRACTICE PROBLEMS ============
PRACTICE_PROBLEMS = {
    'problem_1': {
        'title': '🧮 Practice Problem 1: Calculating Stress',
        'problem': '*Problem:* A steel rod has a cross-sectional area of 50 mm² and experiences a tensile force of 10,000 N. Calculate the stress.\n\n*Given:*\n• Force (F) = 10,000 N\n• Area (A) = 50 mm² = 50 × 10⁻⁶ m²\n\n*Find:* Stress (σ)',
        'solution': '*Solution:*\nσ = F/A\nσ = 10,000 N / (50 × 10⁻⁶ m²)\nσ = 200,000,000 Pa\n**σ = 200 MPa (MegaPascals)**\n\n*Interpretation:* The steel rod experiences a stress of 200 MPa, which is within safe limits for steel!'
    },
    'problem_2': {
        'title': '⚡ Practice Problem 2: Ohm\'s Law',
        'problem': '*Problem:* A circuit has a voltage of 12V and resistance of 3Ω. Find the current.\n\n*Given:*\n• Voltage (V) = 12 V\n• Resistance (R) = 3 Ω\n\n*Find:* Current (I)',
        'solution': '*Solution:*\nUsing Ohm\'s Law: V = IR\nI = V/R\nI = 12V / 3Ω\n**I = 4 Amperes**\n\n*Interpretation:* 4 Amperes of current flows through the circuit. This could power a small device!'
    },
    'problem_3': {
        'title': '⚙️ Practice Problem 3: Power Calculation',
        'problem': '*Problem:* You lift a 50 kg box vertically by 2 meters in 4 seconds. Calculate the power. (Use g = 10 m/s²)\n\n*Given:*\n• Mass = 50 kg\n• Height = 2 m\n• Time = 4 s\n• g = 10 m/s²',
        'solution': '*Solution:*\nFirst, find Work: W = mgh\nW = 50 kg × 10 m/s² × 2 m\nW = 1000 Joules\n\nThen, Power: P = W/t\nP = 1000 J / 4 s\n**P = 250 Watts**\n\n*Interpretation:* You used 250 Watts of power - similar to a bright light bulb!'
    },
}

# ============ CAREER INSIGHTS ============
CAREER_INSIGHTS = {
    'civil': {
        'title': '🏗️ Civil Engineering Careers',
        'content': '*Entry-Level Positions:*\n'
                   '• Graduate Engineer ($50-65k)\n'
                   '• Junior Structural Engineer ($55-70k)\n'
                   '• CAD Technician ($45-60k)\n\n'
                   '*Mid-Level Positions:*\n'
                   '• Project Engineer ($70-90k)\n'
                   '• Site Manager ($75-95k)\n'
                   '• Structural Designer ($80-100k)\n\n'
                   '*Senior Positions:*\n'
                   '• Principal Engineer ($100-150k+)\n'
                   '• Project Director ($110-170k+)\n'
                   '• Consulting Partner ($150k+)\n\n'
                   '*Growth Path:* Graduate → Technician → Engineer → Senior → Director'
    },
    'mechanical': {
        'title': '⚙️ Mechanical Engineering Careers',
        'content': '*Entry-Level Positions:*\n'
                   '• Mechanical Design Engineer ($55-70k)\n'
                   '• Manufacturing Engineer ($50-65k)\n'
                   '• Test Engineer ($52-68k)\n\n'
                   '*Mid-Level Positions:*\n'
                   '• Senior Design Engineer ($80-110k)\n'
                   '• Operations Manager ($85-115k)\n'
                   '• Technical Lead ($90-125k)\n\n'
                   '*Senior Positions:*\n'
                   '• Engineering Manager ($120-160k+)\n'
                   '• Chief Engineer ($140-200k+)\n'
                   '• VP Engineering ($180k+)\n\n'
                   '*Industries:* Automotive, Aerospace, Manufacturing, Energy, HVAC'
    },
    'electrical': {
        'title': '⚡ Electrical Engineering Careers',
        'content': '*Entry-Level Positions:*\n'
                   '• Power Systems Engineer ($58-75k)\n'
                   '• Controls Engineer ($60-78k)\n'
                   '• Junior Electrical Engineer ($55-72k)\n\n'
                   '*Mid-Level Positions:*\n'
                   '• Senior Electrical Engineer ($90-120k)\n'
                   '• Project Manager ($95-130k)\n'
                   '• System Architect ($100-140k)\n\n'
                   '*Senior Positions:*\n'
                   '• Chief Electrical Officer ($150-250k+)\n'
                   '• Consulting Partner ($160-300k+)\n\n'
                   '*High-Paying Specializations:* Power systems, Renewable energy, Semiconductors'
    },
}

# ============ INTERVIEW TIPS ============
INTERVIEW_TIPS = [
    "💼 *Interview Tip 1*\nAlways have 2-3 real project examples ready. Use STAR method (Situation, Task, Action, Result) to explain your achievements!",
    "💼 *Interview Tip 2*\nPrepare to explain one technical concept clearly. Practice explaining stress, power, or circuits in simple terms!",
    "💼 *Interview Tip 3*\nAsk questions about the role! Show you're curious. Good questions: 'What are main challenges?' 'Team structure?'",
    "💼 *Interview Tip 4*\nResearch the company before interview. Know their projects, values, and recent news. Shows genuine interest!",
    "💼 *Interview Tip 5*\nDon't just say 'I'm good at this.' Provide EVIDENCE. 'I designed X which increased Y by Z%'",
    "💼 *Interview Tip 6*\nPractice answering 'Tell me about yourself' - should be 60-90 seconds covering education, experience, and career goals!",
]

# ============ STUDY TIPS ============
STUDY_TIPS = [
    "📚 *Study Tip 1: The Feynman Technique*\nExplain concepts as if teaching a child. If you struggle, you found a gap in your knowledge!",
    "📚 *Study Tip 2: Spaced Repetition*\nReview material after 1 day, 3 days, 1 week, then monthly. This moves knowledge to long-term memory!",
    "📚 *Study Tip 3: Active Practice*\nDon't just read - SOLVE PROBLEMS! Write solutions, draw diagrams, explain out loud!",
    "📚 *Study Tip 4: Connect Concepts*\nDon't learn formulas in isolation. Understand WHY: How does stress relate to strain? How does power relate to force?",
    "📚 *Study Tip 5: Teach Others*\nExplain what you learned to a friend or online community. Teaching forces deep understanding!",
    "📚 *Study Tip 6: 80/20 Rule*\nFocus on concepts that appear in 80% of problems. Master these fundamentals FIRST!",
    "📚 *Study Tip 7: Create Cheat Sheets*\nMake 1-page summaries with key formulas and concepts. Visual + concise = better memory!",
]

# ============ REAL-WORLD APPLICATIONS ============
REAL_WORLD_APPS = {
    'stress': {
        'title': '🌉 Stress in Real Life',
        'content': '*Bridge Design*\nEngineers calculate stress on cables to ensure they won\'t break under car weight!\n\n'
                   '*Building Safety*\nColumns and beams must handle stress from floors, people, and furniture without permanent deformation.\n\n'
                   '*Airplane Construction*\nAircraft materials must withstand enormous stress from pressurization and turbulence.\n\n'
                   '*Pressure Vessels*\nBoilers, tanks, and pipelines designed to safely contain high-pressure gases/liquids without rupturing!'
    },
    'power': {
        'title': '⚡ Power in Real Life',
        'content': '*Light Bulb Rating*\nA 100W bulb uses 100 Joules of energy every second!\n\n'
                   '*Motor Selection*\nHigher power motors can do more work faster. A 5kW motor lifts heavier loads than 1kW motor.\n\n'
                   '*Electric Vehicles*\nMore powerful motors = faster acceleration. Tesla Model S: 600+ kW = 0-60 mph in 3 seconds!\n\n'
                   '*Power Plants*\nMegawatt power plants serve thousands of homes. 1MW = 1,000,000 Watts running simultaneously!'
    },
}

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

    text = None
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Open LEARNcraft App",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )]
    ])

    # Handle main menu options
    if query.data == "show_help":
        text = build_help_text()
    elif query.data == "show_custom":
        text = build_custom_text()
    elif query.data == "start_feedback":
        context.user_data["awaiting_feedback"] = True
        text = FEEDBACK_PROMPT
    
    # Handle lesson selections
    elif query.data.startswith("lesson_"):
        lesson_name = query.data.replace("lesson_", "")
        if lesson_name in QUICK_LESSONS:
            lesson = QUICK_LESSONS[lesson_name]
            text = f"📖 *{lesson['title']}*\n\n{lesson['content']}"
    
    # Handle practice problem selections
    elif query.data.startswith("practice_"):
        problem_num = query.data.replace("practice_", "")
        if int(problem_num) in PRACTICE_PROBLEMS:
            problem = PRACTICE_PROBLEMS[int(problem_num)]
            text = f"🧮 *{problem['title']}*\n\n*Problem:*\n{problem['problem']}\n\n*Solution:*\n{problem['solution']}"
    
    # Handle career path selections
    elif query.data.startswith("career_"):
        field = query.data.replace("career_", "")
        if field in CAREER_INSIGHTS:
            career = CAREER_INSIGHTS[field]
            text = f"💼 *{career['field']}*\n\n{career['description']}"
    
    # Handle real-world app selections
    elif query.data.startswith("app_"):
        app_name = query.data.replace("app_", "")
        if app_name in REAL_WORLD_APPS:
            app = REAL_WORLD_APPS[app_name]
            text = f"🌍 *{app['title']}*\n\n{app['content']}"
    
    # Handle quiz answer viewing
    elif query.data == "show_quiz_answer":
        if 'current_quiz' in context.user_data:
            quiz = context.user_data['current_quiz']
            text = f"✅ *Quiz Answer*\n\n*Answer:* {quiz['answer']}\n\n*Explanation:*\n{quiz['explanation']}"
        else:
            text = "Quiz not found. Use /quiz to start a new quiz!"
    
    else:
        text = "Unknown action. Please use /start, /help, or /custom."

    if query.message and text:
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
    
    # ============ BASIC CONVERSATIONAL RESPONSES ============
    
    # Greetings and general conversations
    greeting_patterns = {
        'hello': "👋 Hello! I'm your AI engineering assistant. How can I help you with engineering today?",
        'hi': "Hey there! 👋 Ready to learn some engineering? What's on your mind?",
        'hey': "Hey! 🙌 I'm here to help with all your engineering questions. What would you like to know?",
        'greetings': "Warm greetings! 🤝 I'm excited to help you with engineering knowledge!",
        'good morning': "Good morning! ☀️ Hope you're ready for some engineering insights today!",
        'good afternoon': "Good afternoon! 🌤 Let's dive into some engineering together!",
        'good evening': "Good evening! 🌙 Ready to explore engineering topics?",
        'good night': "Good night! 😊 Sleep well and come back anytime for engineering help!",
    }
    
    for greeting, response in greeting_patterns.items():
        if greeting in message:
            return response
    
    # How are you / Status questions
    if any(word in message for word in ['how are you', 'how are you doing', 'how you doing', 'whats up', "what's up", 'how are you?', 'how do you do']):
        responses = [
            "I'm doing great! 🤖 Thanks for asking! I'm here and ready to help you with engineering questions. How about you? What can I help with?",
            "Excellent! I'm functioning perfectly and excited to assist you! 💪 What engineering topic interests you today?",
            "I'm good! 😊 Energized and ready to dive into engineering with you. What would you like to explore?",
            "Doing fantastic! 🚀 What engineering challenge can I help you tackle today?",
        ]
        import random
        return random.choice(responses)
    
    # Thanks and gratitude
    if any(word in message for word in ['thanks', 'thank you', 'appreciate', 'thx', 'ty', 'thanks a lot', 'thanks so much']):
        responses = [
            "You're welcome! 😊 Happy to help! If you have more engineering questions, feel free to ask anytime.",
            "Happy to help! 🎯 That's what I'm here for. Need anything else?",
            "My pleasure! 🙌 Engineering knowledge is meant to be shared. What else can I help with?",
            "Anytime! 💡 Keep learning and growing your engineering skills!",
            "You're very welcome! 🤝 If you need more help, I'm always here!",
        ]
        import random
        return random.choice(responses)
    
    # Clarification / Explain more / Teach me
    if any(word in message for word in ['explain me', 'explain', 'teach me', 'tell me about', 'what is', 'define', 'clarify', 'elaborate']):
        # Extract what they want explained
        explain_topics = {
            'stress': "Stress is the force applied to an object per unit area. Formula: σ = F/A\n• Tension stress: pulling force\n• Compression stress: pushing force\n• Shear stress: parallel force\n\nWhat aspect interests you most?",
            'strain': "Strain is the deformation or displacement of material as a result of stress. It's dimensionless.\n• Normal strain: change in length/original length (ε = ΔL/L)\n• Shear strain: angular change\n\nWant to know more?",
            'beam': "A beam is a structural element that primarily resists loads applied laterally to its axis.\n• Simply supported: supported at two ends\n• Cantilever: fixed at one end\n• Continuous: supported at multiple points\n\nWhat type of beam interests you?",
            'circuit': "A circuit is a path through which electrical current flows. Key components:\n• Power source (battery)\n• Resistors\n• Conductors (wires)\n• Load (device using power)\n\nWant to learn about circuit types?",
        }
        
        for topic, explanation in explain_topics.items():
            if topic in message:
                return explanation
        
        return "I'd be happy to explain! 📚 What specific topic or concept would you like me to explain? Try asking about:\n• Stress and Strain\n• Beams and Structures\n• Circuits and Power\n• Forces and Motion\n• Or any engineering topic!"
    
    # Sarcasm / Playful responses (are you dumb, stupid, etc.)
    if any(word in message for word in ['are you dumb', 'are you stupid', 'you dumb', 'you stupid', 'you suck', 'you\'re bad']):
        responses = [
            "😄 No worries if that came across harsh! I'm just a bot designed to help. Even if I make mistakes, I learn and improve. How can I help you with engineering today?",
            "Haha! 😅 I may not be perfect, but I'm here to help! If I gave a wrong answer, let me know and I'll correct it. What's your question?",
            "I might not be the smartest AI out there, but I try my best! 💪 Let's figure this out together. What engineering question do you have?",
            "No hard feelings! 😊 I'm still learning too. What engineering topic can I assist you with?",
            "Fair point! 🤔 But hey, I'm here to help you learn and succeed. What would you like to know?",
        ]
        import random
        return random.choice(responses)
    
    # Confused / Don't understand
    if any(word in message for word in ["i don't understand", "i'm confused", "confused", "not clear", "doesn't make sense", "what do you mean"]):
        return "I apologize for the confusion! 😓 Let me try to explain differently. Could you tell me:\n1. What specific part wasn't clear?\n2. What level of detail do you prefer (basic, intermediate, or advanced)?\n3. Do you have any related knowledge I can build upon?\n\nI'll tailor my explanation to help you better!"
    
    # Compliments and positive feedback
    if any(word in message for word in ['you are great', 'you are awesome', 'you are amazing', 'great job', 'good job', 'excellent', 'amazing', 'awesome', 'love you']):
        responses = [
            "Thank you so much! 🥰 Your kind words motivate me to provide better help! How else can I assist you?",
            "Aww, you're too kind! 😊 I'm here to make learning engineering fun and easy for you!",
            "That's so nice of you to say! 🙌 I really appreciate it. Now let's tackle some engineering challenges together!",
            "You're making my day! 💖 Let's keep this momentum and learn something great!",
        ]
        import random
        return random.choice(responses)
    
    # ============ ENGINEERING-SPECIFIC QUESTIONS ============
    
    # Check if asking about studying or learning
    if any(word in message for word in ['how to study', 'what to study', 'where to start', 'learning path', 'roadmap', 'study plan']):
        return generate_study_guidance(message)
    
    # Check if asking about specific engineering field
    for field in ENGINEERING_KNOWLEDGE.keys():
        if field in message:
            return generate_engineering_answer(field, message)
    
    # Check if asking about formulas
    if any(word in message for word in ['formula', 'equation', 'calculate', 'calculation', 'computation', 'math']):
        return generate_formula_help(message)
    
    # Check if asking about career or education
    if any(word in message for word in ['career', 'job', 'salary', 'university', 'degree', 'work', 'profession']):
        return generate_career_guidance(message)
    
    # ============ DEFAULT RESPONSE ============
    
    # Default intelligent response
    return (
        "🤖 *AI Engineering Assistant*\n\n"
        "I'm here to help with engineering questions!\n\n"
        "You can ask me about:\n"
        "• 📐 Engineering formulas and calculations\n"
        "• 📚 Study plans and learning paths\n"
        "• 🎓 Career guidance in engineering\n"
        "• 🔧 Topics in Civil, Mechanical, Electrical, or Chemical Engineering\n\n"
        "Examples of things you can ask:\n"
        "• 'How do I calculate stress in a beam?'\n"
        "• 'What should I study to become an engineer?'\n"
        "• 'Explain Ohm's law'\n"
        "• 'How are you doing?'\n"
        "• 'Teach me about circuits'\n\n"
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

async def daily_tip_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send daily engineering tip."""
    tip = random.choice(DAILY_TIPS)
    await update.message.reply_text(tip, parse_mode='Markdown')

async def learn_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show available micro-lessons."""
    lessons_list = "\n".join([f"• {topic.title()}" for topic in QUICK_LESSONS.keys()])
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(text="📐 Stress", callback_data="lesson_stress")],
        [InlineKeyboardButton(text="📏 Strain", callback_data="lesson_strain")],
        [InlineKeyboardButton(text="🏗️ Beams", callback_data="lesson_beam")],
        [InlineKeyboardButton(text="⚡ Circuits", callback_data="lesson_circuit")],
        [InlineKeyboardButton(text="⚙️ Force", callback_data="lesson_force")],
        [InlineKeyboardButton(text="💡 Power", callback_data="lesson_power")],
    ])
    
    await update.message.reply_text(
        "📚 *Micro-Learning Lessons*\n\n"
        "Pick a topic to learn quick, focused lessons:\n\n"
        "Select any topic below to get started! 👇",
        parse_mode='Markdown',
        reply_markup=keyboard
    )

async def quiz_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Start engineering quiz."""
    quiz = random.choice(list(ENGINEERING_QUIZZES.values()))
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(text="📖 View Answer", callback_data="show_quiz_answer")],
    ])
    
    await update.message.reply_text(
        quiz['question'] + "\n\n_Click button to see answer after attempting!_",
        parse_mode='Markdown',
        reply_markup=keyboard
    )
    
    context.user_data['current_quiz'] = quiz

async def practice_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show practice problems."""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(text="🧮 Stress Problem", callback_data="practice_1")],
        [InlineKeyboardButton(text="⚡ Ohm's Law", callback_data="practice_2")],
        [InlineKeyboardButton(text="⚙️ Power Problem", callback_data="practice_3")],
    ])
    
    await update.message.reply_text(
        "🧮 *Practice Problems*\n\n"
        "Work through real engineering problems to strengthen your skills:\n\n"
        "Select a problem to get started! 👇",
        parse_mode='Markdown',
        reply_markup=keyboard
    )

async def career_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show career insights."""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(text="🏗️ Civil Engineering", callback_data="career_civil")],
        [InlineKeyboardButton(text="⚙️ Mechanical", callback_data="career_mechanical")],
        [InlineKeyboardButton(text="⚡ Electrical", callback_data="career_electrical")],
    ])
    
    await update.message.reply_text(
        "💼 *Engineering Career Paths*\n\n"
        "Explore salary ranges, positions, and growth opportunities:\n\n"
        "Select a field to learn more! 👇",
        parse_mode='Markdown',
        reply_markup=keyboard
    )

async def interview_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send interview tips."""
    tip = random.choice(INTERVIEW_TIPS)
    await update.message.reply_text(tip, parse_mode='Markdown')

async def study_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send study tips."""
    tip = random.choice(STUDY_TIPS)
    await update.message.reply_text(tip, parse_mode='Markdown')

async def realworld_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show real-world applications."""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(text="🌉 Stress Applications", callback_data="app_stress")],
        [InlineKeyboardButton(text="⚡ Power Applications", callback_data="app_power")],
    ])
    
    await update.message.reply_text(
        "🌍 *Real-World Applications*\n\n"
        "See how engineering concepts apply to real structures and devices:\n\n"
        "Select a topic! 👇",
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
    # Learning commands
    application.add_handler(CommandHandler("daily", daily_tip_command))
    application.add_handler(CommandHandler("learn", learn_command))
    application.add_handler(CommandHandler("quiz", quiz_command))
    application.add_handler(CommandHandler("practice", practice_command))
    application.add_handler(CommandHandler("career", career_command))
    application.add_handler(CommandHandler("interview", interview_command))
    application.add_handler(CommandHandler("study", study_command))
    application.add_handler(CommandHandler("realworld", realworld_command))
    application.add_handler(CallbackQueryHandler(button_callback))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    # Run the bot until the user presses Ctrl-C
    application.run_polling()

if __name__ == '__main__':
    main()
