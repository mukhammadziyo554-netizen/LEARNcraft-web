/**
 * Telegram Mini App Initialization
 * This script initializes the Telegram WebApp API
 */

// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;

// Detect if running in Telegram Mini App and setup UI accordingly
function detectAndSetupTelegramUI() {
    // Check if we're in Telegram Mini App environment
    const isTelegramMiniApp = typeof window.Telegram !== 'undefined' && 
                              window.Telegram.WebApp && 
                              window.Telegram.WebApp.initDataUnsafe;
    
    if (isTelegramMiniApp) {
        console.log('🤖 Running in Telegram Mini App');
        // Add class to body to show Telegram-specific UI elements
        document.documentElement.classList.add('tg-mini-app-show');
    } else {
        console.log('📱 Running as web app');
    }
}

// Call detection on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectAndSetupTelegramUI);
} else {
    detectAndSetupTelegramUI();
}

// When the web app is ready
window.addEventListener('load', function() {
    // Signal to Telegram that the app is ready
    tg.ready();
    
    // Set the header color to match your app theme
    tg.setHeaderColor('#0b0b0b');
    
    // Set the background color
    tg.setBackgroundColor('#0b0b0b');
    
    // Enable the main button for potential actions
    setupMainButton();
    
    // Get user data if available
    const user = tg.initDataUnsafe?.user;
    if (user) {
        console.log('User Data:', user);
        // You can use user data here (user.id, user.first_name, user.username, etc.)
    }
});

// Setup the main button
function setupMainButton() {
    tg.MainButton.textColor = '#000000';
    tg.MainButton.color = '#FFD700';
    
    tg.MainButton.onClick(() => {
        // Handle main button click
        console.log('Main Button clicked');
    });
}

// Close the web app
function closeWebApp() {
    tg.close();
}

// Request user info (phone, location with user permission)
function requestUserInfo() {
    tg.requestPhoneNumber();
}

// Haptic feedback
function triggerHaptic() {
    tg.HapticFeedback.impactOccurred('medium');
}

// Send data back to the bot
function sendDataToBot(data) {
    tg.sendData(JSON.stringify(data));
}

// Expand the web app to full screen
function expandWebApp() {
    tg.expand();
}

// Listen for orientation changes
window.addEventListener('orientationchange', function() {
    console.log('Orientation changed to:', window.innerWidth, 'x', window.innerHeight);
});

// Export functions for use in your app
window.TelegramWebApp = {
    tg: tg,
    close: closeWebApp,
    requestUserInfo: requestUserInfo,
    triggerHaptic: triggerHaptic,
    sendDataToBot: sendDataToBot,
    expand: expandWebApp,
    getUserData: () => tg.initDataUnsafe?.user,
    isWebAppClosed: () => tg.isClosingConfirmationEnabled
};

console.log('Telegram WebApp initialized successfully');
