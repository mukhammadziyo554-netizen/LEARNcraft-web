// Home page behaviour: pricing plan switch, the keyword-based Ask AI chat,
// signed-in state in the header, Telegram mini app setup, and activity saving.
// Shared header, drawer, language and theme behaviour lives in js/site.js.

(function () {
    'use strict';

    function readJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    /* ---------- Pricing plan switch ---------- */
    function initPricing() {
        const buttons = document.querySelectorAll('[data-plan-switch]');
        const cards = document.querySelectorAll('.pricing-card[data-plan]');
        if (!buttons.length || !cards.length) return;

        function select(plan, scroll) {
            buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.planSwitch === plan)));
            cards.forEach((c) => c.classList.toggle('is-selected', c.dataset.plan === plan));
            const card = document.querySelector(`.pricing-card[data-plan="${plan}"]`);
            if (scroll && card && window.matchMedia('(max-width: 767px)').matches) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        buttons.forEach((b) => b.addEventListener('click', () => select(b.dataset.planSwitch, true)));
        select('6month', false);
    }

    /* ---------- Ask AI chat (keyword answers, 3 free questions) ---------- */
    let messageCount = 0;
    const freeMessageLimit = 3;

    const civilEngineeringKnowledge = {
        // Greetings
        'hi': 'Hey there! How can I help you today? Feel free to ask me about civil engineering, mathematics, physics, or test prep.',
        'hello': 'Hello! I am here to assist you with any questions you have. What would you like to learn about today?',
        'how are you': 'I am doing great, thank you for asking! How can I help you with your studies today?',
        'what are you doing': 'I am here to help you learn and answer all your questions about engineering, math, science, and academic topics. What do you need help with?',
        'hi there': 'Hi! Welcome! I am ready to answer your questions. Feel free to ask me anything related to your studies.',
        'whats up': 'Not much! Just here to help you learn. What is on your mind?',
        
        // Civil Engineering
        'civil engineering': 'Civil engineering is the professional discipline that deals with the design, construction, and maintenance of infrastructure and the built environment. This includes roads, bridges, buildings, dams, water systems, and tunnels. Civil engineers apply principles of physics, materials science, and mathematics to solve practical problems. The field is divided into several specializations: Structural engineering focuses on buildings and structures, Geotechnical engineering deals with soil and underground work, Transportation engineering covers roads and transit systems, Water resources engineering manages water supply and drainage, and Environmental engineering addresses pollution and sustainability.',
        
        'beam': 'A beam is a structural member that carries loads perpendicular to its length. Beams resist bending and can be classified by their support conditions. A Simply Supported Beam is supported at both ends and free to rotate. A Cantilever Beam is fixed at one end and extends freely from that point. A Continuous Beam spans across multiple supports. The bending moment at the center of a simply supported beam with uniform load is M equals w times L squared divided by 8. Deflection is calculated using the formula delta equals 5 times w times L to the fourth power divided by 384 times E times I.',
        
        'bending': 'Bending is the deformation of a beam under transverse loads. When a beam bends, some fibers are in compression and others are in tension. The Bending Moment is the internal moment that resists the bending action. The Shear Force is the internal force perpendicular to the beam axis. The Neutral Axis is the line within the beam where there is zero stress during bending. The Flexure Formula is sigma equals M times y divided by I, where sigma is the bending stress, M is the bending moment, y is the distance from the neutral axis, and I is the moment of inertia.',
        
        'soil': 'Soil mechanics is the study of soil behavior under applied stresses and strains. Key soil properties include Bearing Capacity which is the maximum load per unit area that soil can safely support, Consolidation which is the gradual compression of soil under sustained load, Shear Strength which is the maximum stress the soil can resist before sliding, and Permeability which determines how easily water moves through soil. Soil is classified by grain size as Sand for coarse particles, Silt for medium particles, and Clay for fine particles. Soil testing includes the Proctor test for compaction and the Triaxial test for shear strength.',
        
        'concrete': 'Concrete is made from cement, fine aggregates like sand, coarse aggregates like gravel, and water. The compressive strength of concrete typically ranges from 20 to 40 megapascals for normal concrete. The Water-Cement Ratio is critical for strength development with ratios between 0.4 and 0.6 being ideal. Concrete requires proper curing for a minimum of 7 to 28 days to achieve design strength. Steel reinforcement is added to provide tensile strength since concrete is weak in tension. A typical concrete mix design uses a ratio of 1 part cement to 2 parts sand to 4 parts coarse aggregate.',
        
        'load': 'Loads are external forces that act on structures. Dead Load is the permanent weight of the structure itself. Live Load includes temporary loads such as occupants, furniture, and equipment. Wind Load is the lateral force exerted by wind on the structure. Snow Load is the weight of accumulated snow on roof surfaces. Seismic Load refers to forces generated by earthquakes. The Load Factor Design method combines loads with safety factors to ensure adequate strength. A typical load combination for design is 1.4 times Dead Load plus 1.6 times Live Load.',
        
        'foundation': 'Foundations are structures that transfer building loads to the underlying soil. Shallow Foundations include Spread Footings which are used for individual columns, Mat or Raft Foundations which distribute loads over a large area, and Combined Footings which support multiple columns. Deep Foundations include Pile Foundations which consist of long slender members driven into the ground, Drilled Shafts which are holes drilled and filled with concrete, and Caissons which are large diameter holes. Foundation design considers bearing capacity, settlement, depth below grade, and groundwater conditions.',
        
        'steel': 'Steel is an alloy of iron and carbon with excellent strength properties. The Yield Strength typically ranges from 250 to 500 megapascals depending on steel grade. The Ultimate Strength or tensile strength ranges from 400 to 650 megapascals. The Elastic Modulus or Young modulus is approximately 200 gigapascals. Common steel sections include Wide Flange beams or I-beams, Channels, Angles, and Hollow sections. Steel connections can be Bolted using steel bolts and nuts, Welded using fusion of metal, or less commonly Riveted. Steel structures are protected from corrosion by Painting, Galvanizing with zinc coating, or using corrosion-resistant steel.',
        
        'column': 'Columns are vertical members that primarily resist compression. Short Columns are stocky and fail by material crushing or yielding. Slender Columns are long and fail by buckling or lateral deflection. The Length to Radius ratio determines the column classification. The Euler Buckling Formula gives the critical load as Pcr equals pi squared times E times I divided by L squared. Reinforced concrete columns can be Tied Columns which are rectangular with horizontal ties or Spiral Columns which are circular with continuous spirals. The spiral provides better confinement and increases ductility.',
        
        'retaining wall': 'Retaining walls support soil and are used in sloped terrain or excavations. A Gravity Wall relies on its own weight for stability. A Cantilever Wall is an L-shaped reinforced concrete structure that uses soil weight on the heel for stability. A Counterfort Wall has vertical supports or buttresses on the back face. A Mechanically Stabilized Earth or MSE Wall uses layers of reinforcing material with soil. Design checks include Overturning which requires a safety factor greater than 2, Sliding which requires a safety factor greater than 1.5, and Bearing Capacity. Active and passive earth pressures are calculated using Rankine theory or Coulomb theory.',
        
        'earthquake': 'Seismic or earthquake-resistant design protects structures from damage during earthquakes. The Base Shear is the total horizontal force at the base of the structure calculated as V equals Cs times W. The Seismic Coefficient depends on the location, soil conditions, and building importance. Response Spectra show the maximum response of structures at different natural periods. Ductility is the ability of a structure to deform inelastically without collapse. Key design principles include providing Redundancy or multiple load paths, using Ductile Details to allow plastic deformation, maintaining Strong column weak beam hierarchy, and providing Shear Walls for lateral stability.',
        
        'bridge': 'Bridges span obstacles and connect separated areas. Beam Bridges are the simplest type with spans typically up to 100 meters. Arch Bridges carry loads through compression and can span up to 500 meters. Suspension Bridges use cables suspended from towers and can span over 2000 meters. Cable-stayed Bridges use cables connected directly from towers to the deck and can span 500 to 1000 meters. Bridge design loads include HS-20 truck loading for highways, Lane loads, Dynamic impact factors, and environmental loads. Main components include the Deck where traffic runs, Girders that span between supports, Piers that support the bridge, Abutments at the ends, and Bearings that allow movement.',
        
        'water': 'Water resources engineering deals with water supply, treatment, and management. Hydraulics is the study of water flow in channels and pipes using equations and principles. Hydrology is the study of the water cycle including precipitation, infiltration, and runoff. The Manning Equation calculates flow in open channels as Q equals 1 divided by n times A times R to the 2/3 power times S to the 1/2 power where Q is flow rate, n is roughness coefficient, A is area, R is hydraulic radius, and S is slope. Drainage systems include Storm Sewers, Culverts under roads, and Detention Ponds for storage.',
        
        'surveying': 'Surveying is the science of measuring and mapping land. Leveling measures vertical distances and determines elevations. A Theodolite measures horizontal and vertical angles. A Total Station combines angle and distance measurements electronically. GPS and GNSS use satellite signals for positioning. Basic surveying principles include Benchmarks which are fixed known points, Traverses which are connected sequences of survey lines, and Closed loops where measurements return to the starting point. Construction surveying requires accuracy of plus or minus 5 millimeters. Applications include Site layout, Topographic mapping, and Volume calculations.',
        
        'pavement': 'Pavement is the surface layer of roads designed to carry traffic loads. Flexible Pavement using Asphalt is constructed in layers including Surface Course, Binder Course, Base Course, Subbase, and Subgrade. Rigid Pavement using Concrete is laid as a single slab on base and subbase with joints for thermal movement. Pavement design methods include the AASHTO method based on testing and the Mechanistic-Empirical method using material properties. Common failure modes are Rutting or permanent deformation, Cracking including alligator cracks and reflective cracks, and Potholes. Most pavements last 20 to 30 years before requiring rehabilitation.',
        
        'safety': 'Construction safety is essential on all job sites. Personal Protective Equipment or PPE includes Hard Hats to protect the head, Safety Boots for foot protection, High-Visibility Vests to increase visibility, Safety Glasses to protect eyes, and Fall Protection harnesses for work at heights above 6 feet. OSHA or Occupational Safety and Health Administration enforces standards for Excavation protection, Scaffold safety, Confined space entry, and Hazard communication. Site safety plans must be prepared before construction begins. Daily Toolbox Talks educate workers about hazards. Incident Reporting documents all accidents for analysis. The goal of modern safety programs is Zero accidents on every project.',
        
        // Math
        'calculus': 'Calculus is the mathematics of continuous change and motion. Differential Calculus deals with instantaneous rates of change and is used to find slopes and optimize functions. Integral Calculus deals with accumulation and is used to find areas and volumes. The Derivative of a function represents its instantaneous rate of change. The Integral is the reverse operation of differentiation. Calculus is essential in engineering for analyzing motion, designing optimal structures, and modeling physical phenomena. Applications include finding velocities and accelerations, optimizing designs for minimum cost or weight, and modeling fluid flow and heat transfer.',
        
        'derivatives': 'A derivative measures how fast a function is changing at a particular point. The derivative of a function f of x is written as df/dx or f prime of x. Geometrically, the derivative is the slope of the tangent line to the curve at that point. The Power Rule states that the derivative of x to the n equals n times x to the n minus 1. The Product Rule applies to products of functions. The Chain Rule applies to composite functions. Other important rules include the Quotient Rule for division and the Exponential Rule for e to the x. Derivatives are used in engineering for finding velocities, accelerations, and optimization.',
        
        'math': 'Mathematics is the study of quantity, structure, space, and change. Algebra deals with variables and equations. Geometry studies shapes and spatial relationships. Trigonometry deals with angles and triangles. Calculus studies rates of change and accumulation. Linear Algebra deals with matrices and vectors. Differential Equations relate functions to their derivatives. In civil engineering, mathematics provides the tools to model structures, analyze stresses, calculate flows, and design systems. Strong mathematical skills are essential for understanding engineering principles and solving complex problems. Most engineering problems require setting up equations and solving them systematically.',
        
        'kinematics': 'Kinematics is the study of motion without considering the forces causing the motion. Position is the location of an object in space. Velocity is the rate of change of position with respect to time and is vector quantity with direction. Acceleration is the rate of change of velocity. Important kinematic equations for constant acceleration include v equals v0 plus a times t where v is final velocity, v0 is initial velocity, a is acceleration, and t is time. Another equation is s equals v0 times t plus 0.5 times a times t squared for displacement. Also v squared equals v0 squared plus 2 times a times s. These equations are fundamental in physics and engineering.',
        
        'ap tests': 'AP or Advanced Placement tests are standardized exams offered by the College Board. These exams allow high school students to earn college credit while still in high school. Common AP tests include AP Calculus AB and BC covering differential and integral calculus, AP Physics 1 and 2 covering mechanics and electricity, AP Chemistry covering chemistry principles, and AP Biology covering biological sciences. Students typically complete an AP course for an academic year and then take the exam in May. High scores can earn college credit, reduce time in college, and demonstrate academic strength to college admissions officers.',
        
        'why ap tests': 'AP tests are valuable for several important reasons. First, earning college credit in high school can save you tuition costs and allow you to graduate early. Second, strong AP scores significantly strengthen college applications by demonstrating your ability to handle advanced coursework. Third, AP courses prepare you for the rigor and pace of college classes. Fourth, if you score well on AP exams, you can skip introductory college courses and take more advanced classes sooner. Fifth, AP tests provide a standardized national assessment that colleges recognize and respect. Sixth, completion of AP courses shows colleges that you challenge yourself academically. Most colleges award credit for scores of 3 or higher on a scale of 1 to 5.',
        
        'default': 'I can help you with many topics. For Civil Engineering I can discuss structural design, materials, foundations, and construction. For Mathematics I can explain calculus, derivatives, algebra, and geometry. For Physics I can cover kinematics, forces, energy, and waves. I can also help prepare you for AP tests and explain why they are important. What specific topic would you like to learn about today?'
    };

    // Whole-word match, so "hi" does not fire on "this" or "which".
    function generateResponse(message) {
        for (const [keyword, response] of Object.entries(civilEngineeringKnowledge)) {
            if (keyword === 'default') continue;
            const pattern = new RegExp(`(^|[^a-z])${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z])`);
            if (pattern.test(message)) return response;
        }
        return civilEngineeringKnowledge.default;
    }

    function addMessage(text, type) {
        const list = document.getElementById('chatMessages');
        if (!list) return;
        const item = document.createElement('div');
        item.className = `chat-msg chat-msg--${type === 'user' ? 'user' : 'ai'}`;
        const who = document.createElement('span');
        who.className = 'chat-msg__who';
        who.textContent = type === 'user' ? 'You' : 'AI';
        const body = document.createElement('p');
        body.className = 'chat-msg__text';
        body.textContent = text; // never innerHTML: the text can come from the user
        item.append(who, body);
        list.appendChild(item);
        list.scrollTop = list.scrollHeight;
    }

    function showSubscriptionPrompt() {
        const list = document.getElementById('chatMessages');
        if (!list) return;
        const item = document.createElement('div');
        item.className = 'chat-msg chat-msg--ai chat-upgrade';
        item.innerHTML = `
            <span class="chat-msg__who">AI</span>
            <div class="chat-msg__text">
                <p><strong>You've used your ${freeMessageLimit} free questions.</strong></p>
                <p>LEARNcraft Pro includes full AI tutor access, unlimited questions, every civil engineering roadmap and progress tracking.</p>
                <div class="lc-row">
                    <button class="lc-btn lc-btn--secondary" type="button" data-chat-free>Continue free</button>
                    <a class="lc-btn lc-btn--primary" href="#pricing">See Pro plans</a>
                </div>
            </div>`;
        item.querySelector('[data-chat-free]').addEventListener('click', () => {
            messageCount = 0;
            item.remove();
            addMessage(`You can ask ${freeMessageLimit} more questions.`, 'ai');
        });
        list.appendChild(item);
        list.scrollTop = list.scrollHeight;
    }

    function sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input ? input.value.trim() : '';
        if (!message) return;
        addMessage(message, 'user');
        input.value = '';
        messageCount++;
        if (messageCount > freeMessageLimit) {
            setTimeout(showSubscriptionPrompt, 400);
            return;
        }
        setTimeout(() => addMessage(generateResponse(message.toLowerCase()), 'ai'), 600);
    }

    function initChat() {
        const form = document.getElementById('chatForm');
        if (!form) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    /* ---------- Signed-in state ---------- */
    const ADMIN_EMAIL = 'mukhammadziyo554@gmail.com';

    function initAccount() {
        const signIn = document.getElementById('signInBtn');
        const account = document.getElementById('userAccount');
        const user = readJSON('learncraft_current_user', null);
        if (!signIn || !account) return;

        if (!user || !user.email) {
            signIn.hidden = false;
            account.hidden = true;
            return;
        }

        signIn.hidden = true;
        account.hidden = false;
        document.getElementById('userCircle').textContent = user.email.charAt(0).toUpperCase();
        document.getElementById('userEmail').textContent = user.email;

        const circle = document.getElementById('userCircle');
        const menu = document.getElementById('userMenu');
        circle.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = menu.hidden;
            menu.hidden = !open;
            circle.setAttribute('aria-expanded', String(open));
        });
        document.addEventListener('click', (e) => {
            if (!account.contains(e.target)) {
                menu.hidden = true;
                circle.setAttribute('aria-expanded', 'false');
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !menu.hidden) {
                menu.hidden = true;
                circle.setAttribute('aria-expanded', 'false');
                circle.focus();
            }
        });
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('learncraft_current_user');
            window.location.reload();
        });

        // The admin link is shown only to the admin account.
        if (user.email.toLowerCase() === ADMIN_EMAIL) {
            const admin = document.getElementById('sidebarAdminLink');
            if (admin) admin.hidden = false;
        }
    }

    /* ---------- Telegram mini app ---------- */
    function initTelegram() {
        const tg = window.Telegram && window.Telegram.WebApp;
        if (!tg) return;
        try {
            tg.expand();
            tg.enableClosingConfirmation();
        } catch (e) {
            // Outside Telegram these calls are no-ops.
        }
    }

    /* ---------- Activity saving (read by the admin analytics pages) ---------- */
    function saveUserData() {
        const currentUser = readJSON('learncraft_current_user', null);
        if (!currentUser) return;
        const users = readJSON('learncraft_users', []);
        const i = users.findIndex((u) => u.id === currentUser.id);
        if (i === -1) return;
        users[i].lastActive = new Date().toISOString();
        users[i].preferredLanguage = localStorage.getItem('learncraft_language') || 'en';
        if (!users[i].visitedFields) users[i].visitedFields = [];
        localStorage.setItem('learncraft_users', JSON.stringify(users));
    }

    function initActivity() {
        if (readJSON('learncraft_current_user', null)) setInterval(saveUserData, 30000);
    }

    function init() {
        initPricing();
        initChat();
        initAccount();
        initTelegram();
        initActivity();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
