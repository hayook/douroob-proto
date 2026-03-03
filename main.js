// main.js - Vanilla JS Supabase Social Clone

const SUPABASE_URL = 'https://csopcjxlibyruzgsftbl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DRslmDUWe88N7VToYOTDWA_rdLhZWzt';

// Initialize the Supabase client
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // Containers
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const userInfoView = document.getElementById('user-info');
    
    // Status and Output
    const statusText = document.getElementById('status');
    const outputText = document.getElementById('output');
    const userEmailSpan = document.getElementById('user-email');

    // Navigation Toggle Links
    const goToRegister = document.getElementById('go-to-register');
    const goToLogin = document.getElementById('go-to-login');

    // Form Submissions
    const btnLoginSubmit = document.getElementById('btn-login-submit');
    const btnRegisterSubmit = document.getElementById('btn-register-submit');
    const btnLogout = document.getElementById('btn-logout');

    // UI State Management
    const showView = (viewName) => {
        loginView.style.display = viewName === 'login' ? 'block' : 'none';
        registerView.style.display = viewName === 'register' ? 'block' : 'none';
        userInfoView.style.display = viewName === 'profile' ? 'block' : 'none';
        
        // Hide output when switching views
        outputText.textContent = '';
    };

    const updateAuthUI = (session) => {
        if (session) {
            showView('profile');
            userEmailSpan.textContent = session.user.email;
            statusText.textContent = 'Welcome back!';
        } else {
            showView('login');
            statusText.textContent = 'Please log in';
        }
    };

    // View Switching
    goToRegister.addEventListener('click', () => showView('register'));
    goToLogin.addEventListener('click', () => showView('login'));

    // Listen for auth state changes
    _supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        updateAuthUI(session);
    });

    // Handle Register
    btnRegisterSubmit.addEventListener('click', async () => {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        if (!email || !password) {
            outputText.textContent = 'Email and password are required.';
            return;
        }

        const { data, error } = await _supabase.auth.signUp({ email, password });
        
        if (error) {
            outputText.textContent = 'Signup Error: ' + error.message;
        } else {
            outputText.textContent = 'Success! Check your email for verification.';
        }
    });

    // Handle Login
    btnLoginSubmit.addEventListener('click', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            outputText.textContent = 'Email and password are required.';
            return;
        }

        const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            outputText.textContent = 'Login Error: ' + error.message;
        } else {
            outputText.textContent = 'Logged in successfully!';
        }
    });

    // Handle Logout
    btnLogout.addEventListener('click', async () => {
        const { error } = await _supabase.auth.signOut();
        if (error) {
            outputText.textContent = 'Logout Error: ' + error.message;
        } else {
            outputText.textContent = 'Logged out.';
        }
    });
});
