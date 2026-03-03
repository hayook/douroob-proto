// main.js - Vanilla JS Supabase Social Clone

const SUPABASE_URL = 'https://csopcjxlibyruzgsftbl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DRslmDUWe88N7VToYOTDWA_rdLhZWzt';

// Initialize the Supabase client
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const status = document.getElementById('status');
    const output = document.getElementById('output');
    const loginForm = document.getElementById('login-form');
    const userInfo = document.getElementById('user-info');
    const userEmailSpan = document.getElementById('user-email');

    // UI elements
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const btnLogin = document.getElementById('btn-login');
    const btnSignup = document.getElementById('btn-signup');
    const btnLogout = document.getElementById('btn-logout');

    // Update UI based on session
    const updateUI = (session) => {
        if (session) {
            loginForm.style.display = 'none';
            userInfo.style.display = 'block';
            userEmailSpan.textContent = session.user.email;
            status.textContent = 'Authenticated';
        } else {
            loginForm.style.display = 'block';
            userInfo.style.display = 'none';
            userEmailSpan.textContent = '';
            status.textContent = 'Please log in';
        }
    };

    // Listen for auth state changes
    _supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        updateUI(session);
    });

    // Sign Up
    btnSignup.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        
        const { data, error } = await _supabase.auth.signUp({ email, password });
        
        if (error) {
            output.textContent = 'Signup Error: ' + error.message;
        } else {
            output.textContent = 'Signup Successful! Check your email for verification.';
        }
    });

    // Sign In
    btnLogin.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        
        const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            output.textContent = 'Login Error: ' + error.message;
        } else {
            output.textContent = 'Logged in successfully!';
        }
    });

    // Sign Out
    btnLogout.addEventListener('click', async () => {
        const { error } = await _supabase.auth.signOut();
        if (error) {
            output.textContent = 'Logout Error: ' + error.message;
        } else {
            output.textContent = 'Logged out.';
        }
    });
});
