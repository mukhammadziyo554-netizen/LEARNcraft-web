// Global Theme Management System
// This script is loaded on ALL pages (except admin dashboard)
// Theme toggle button exists ONLY on index.html

(function() {
    'use strict';
    
    const THEME_KEY = 'learncraft_theme';
    
    // Apply theme immediately to prevent flash
    function applyTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        const body = document.body;
        
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
            
            if (wasLight) {
                body.classList.remove('light-mode');
                localStorage.setItem(THEME_KEY, 'dark');
                return false;
            } else {
                body.classList.add('light-mode');
                localStorage.setItem(THEME_KEY, 'light');
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
})();
