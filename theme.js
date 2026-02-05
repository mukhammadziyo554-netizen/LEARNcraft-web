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
    
    // Apply theme as soon as possible
    applyTheme();
    
    // Also apply on DOM ready to ensure it sticks
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyTheme);
    }
    
    // Export functions for theme toggle (only used on index.html)
    window.LearnCraftTheme = {
        toggle: function() {
            const body = document.body;
            body.classList.toggle('light-mode');
            const isLight = body.classList.contains('light-mode');
            localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
            return isLight;
        },
        
        getCurrent: function() {
            return document.body.classList.contains('light-mode') ? 'light' : 'dark';
        },
        
        set: function(theme) {
            const body = document.body;
            if (theme === 'light') {
                body.classList.add('light-mode');
            } else {
                body.classList.remove('light-mode');
            }
            localStorage.setItem(THEME_KEY, theme);
        }
    };
})();
