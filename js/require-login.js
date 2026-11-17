// Sends signed-out visitors to the sign-in page.
// Uses the same sign-in record as the rest of the site (localStorage
// "learncraft_current_user", written by pages/login.html).
// Load it in <head> so the page never flashes for signed-out visitors:
//   <script src="../js/require-login.js" data-login="../pages/login.html"></script>
// This is a convenience gate in the browser, not security: anyone can edit
// localStorage. Protect real data on the server.

(function () {
    'use strict';

    const script = document.currentScript;
    const loginUrl = (script && script.dataset.login) || 'login.html';

    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('learncraft_current_user') || 'null');
    } catch (e) {
        user = null;
    }

    if (!user || !user.email) {
        window.location.replace(loginUrl);
    }
})();
