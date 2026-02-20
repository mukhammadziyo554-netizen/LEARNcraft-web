// Toggle between login and register forms with animation
const authCard = document.getElementById('authCard');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

showRegister.addEventListener('click', () => {
  authCard.classList.add('active');
});

showLogin.addEventListener('click', () => {
  authCard.classList.remove('active');
});

// Prevent default form submission for demo
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  loginForm.querySelector('.auth-btn').textContent = 'Logging in...';
  setTimeout(() => {
    loginForm.querySelector('.auth-btn').textContent = 'Login';
    alert('Logged in (demo)');
  }, 900);
});

registerForm.addEventListener('submit', e => {
  e.preventDefault();
  registerForm.querySelector('.auth-btn').textContent = 'Registering...';
  setTimeout(() => {
    registerForm.querySelector('.auth-btn').textContent = 'Register';
    alert('Registered (demo)');
  }, 1200);
});
