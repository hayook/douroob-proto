// main.js - Vanilla JS Supabase Social Clone

const SUPABASE_URL = 'https://csopcjxlibyruzgsftbl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DRslmDUWe88N7VToYOTDWA_rdLhZWzt';

// Initialize the Supabase client
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // Top-level containers
    const authViews = document.getElementById('auth-views');
    const appHeader = document.getElementById('app-header');
    const mainView = document.getElementById('user-info');
    
    // Auth sub-views
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    
    // Profile components
    const profileName = document.getElementById('profile-name');
    const profileUsername = document.getElementById('profile-username');
    const profilesList = document.getElementById('profiles-list');
    
    // Status and Output
    const statusText = document.getElementById('status');
    const outputText = document.getElementById('output');

    // Navigation Toggle Links
    const goToRegister = document.getElementById('go-to-register');
    const goToLogin = document.getElementById('go-to-login');

    // Buttons
    const btnLoginSubmit = document.getElementById('btn-login-submit');
    const btnRegisterSubmit = document.getElementById('btn-register-submit');
    const btnLogout = document.getElementById('btn-logout');

    const showView = (viewName) => {
        if (viewName === 'profile') {
            authViews.style.display = 'none';
            appHeader.style.display = 'block';
            mainView.style.display = 'grid';
        } else {
            authViews.style.display = 'block';
            appHeader.style.display = 'none';
            mainView.style.display = 'none';
            loginView.style.display = viewName === 'login' ? 'block' : 'none';
            registerView.style.display = viewName === 'register' ? 'block' : 'none';
        }
        outputText.style.display = 'none';
    };

    const showToast = (message, isError = false) => {
        outputText.textContent = message;
        outputText.style.display = 'block';
        outputText.style.borderColor = isError ? '#ef4444' : '#3b82f6';
        setTimeout(() => { outputText.style.display = 'none'; }, 4000);
    };

    // Helper to fetch and render all profiles
    const loadAllProfiles = async (currentUserId) => {
        const { data, error } = await _supabase
            .from('profiles')
            .select('id, username, full_name')
            .neq('id', currentUserId); // Exclude yourself

        if (error) {
            profilesList.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            return;
        }

        if (data.length === 0) {
            profilesList.innerHTML = '<p style="color: #666;">No other users yet.</p>';
            return;
        }

        profilesList.innerHTML = data.map(p => `
            <div class="user-item">
                <div class="avatar-placeholder"></div>
                <div style="flex: 1;">
                    <p style="font-weight: 600; font-size: 0.9rem;">${p.full_name}</p>
                    <small style="color: #3b82f6;">@${p.username}</small>
                </div>
                <button style="padding: 0.25rem 0.75rem; font-size: 0.8rem; background: transparent; border: 1px solid #3b82f6; color: #3b82f6;">Follow</button>
            </div>
        `).join('');
    };

    // Update UI based on auth state
    const updateAuthUI = async (session) => {
        if (session) {
            showView('profile');
            statusText.textContent = `Signed in as: ${session.user.email}`;

            // Fetch current user's profile
            const { data: profile } = await _supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                profileName.textContent = profile.full_name;
                profileUsername.textContent = '@' + profile.username;
            }

            // Load all profiles
            loadAllProfiles(session.user.id);
        } else {
            showView('login');
        }
    };

    // View Switching
    goToRegister.addEventListener('click', () => showView('register'));
    goToLogin.addEventListener('click', () => showView('login'));

    // Listen for auth state changes
    _supabase.auth.onAuthStateChange((event, session) => {
        updateAuthUI(session);
    });

    // Handle Register
    btnRegisterSubmit.addEventListener('click', async () => {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        if (!email || !password) return showToast('Email/password required', true);

        const uniqueId = crypto.randomUUID().split('-')[0];
        const { error } = await _supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: 'Douroob user', username: `user_${uniqueId}` } }
        });
        
        if (error) showToast(error.message, true);
        else showToast('Registration successful! You can now log in.');
    });

    // Handle Login
    btnLoginSubmit.addEventListener('click', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        if (!email || !password) return showToast('Email/password required', true);

        const { error } = await _supabase.auth.signInWithPassword({ email, password });
        if (error) showToast(error.message, true);
    });

    // Handle Logout
    btnLogout.addEventListener('click', async () => {
        const { error } = await _supabase.auth.signOut();
        if (error) showToast(error.message, true);
    });
});
