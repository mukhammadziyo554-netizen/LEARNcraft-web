// Global Theme Management System
// This script is loaded on ALL pages (except admin dashboard)
// Theme toggle button exists ONLY on index.html

(function() {
    'use strict';
    
    const THEME_KEY = 'learncraft_theme';
    
    console.log('🎨 Theme system loaded');
    
    // Apply theme immediately to prevent flash
    function applyTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        const body = document.body;
        
        console.log('Applying theme:', savedTheme || 'dark (default)');
        
        if (savedTheme === 'light') {
            body.classList.add('light-mode');
        } else {
            body.classList.remove('light-mode');
        }
    }
    
    // Apply theme immediately - run synchronously
    applyTheme();
    
    // Also apply on DOM ready to ensure it sticks
    document.addEventListener('DOMContentLoaded', applyTheme);
    
    // Apply on page show (for back/forward navigation)
    window.addEventListener('pageshow', applyTheme);
    
    // Export functions for theme toggle (only used on index.html)
    window.LearnCraftTheme = {
        toggle: function() {
            const body = document.body;
            const wasLight = body.classList.contains('light-mode');
            
            console.log('Toggle clicked! Current:', wasLight ? 'light' : 'dark');
            
            if (wasLight) {
                body.classList.remove('light-mode');
                localStorage.setItem(THEME_KEY, 'dark');
                console.log('Switched to DARK mode');
                return false;
            } else {
                body.classList.add('light-mode');
                localStorage.setItem(THEME_KEY, 'light');
                console.log('Switched to LIGHT mode');
                return true;
            }
        },
        
        getCurrent: function() {
            return document.body.classList.contains('light-mode') ? 'light' : 'dark';
        },
        
        set: function(theme) {
            const body = document.body;
            if (theme === 'light') {
                body.classList.add('light-mode');
                localStorage.setItem(THEME_KEY, 'light');
            } else {
                body.classList.remove('light-mode');
                localStorage.setItem(THEME_KEY, 'dark');
            }
        }
    };
    
    console.log('✅ LearnCraftTheme ready:', window.LearnCraftTheme);
})();
