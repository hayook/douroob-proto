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
    
    // UI Elements
    const profileName = document.getElementById('profile-name');
    const profileUsername = document.getElementById('profile-username');
    const profilesList = document.getElementById('profiles-list');
    const feedContainer = document.getElementById('feed-container');
    const postContent = document.getElementById('post-content');
    const statusText = document.getElementById('status');
    const outputText = document.getElementById('output');

    // Buttons
    const btnLoginSubmit = document.getElementById('btn-login-submit');
    const btnRegisterSubmit = document.getElementById('btn-register-submit');
    const btnPostSubmit = document.getElementById('btn-post-submit');
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
            document.getElementById('login-view').style.display = viewName === 'login' ? 'block' : 'none';
            document.getElementById('register-view').style.display = viewName === 'register' ? 'block' : 'none';
        }
    };

    const showToast = (message, isError = false) => {
        outputText.textContent = message;
        outputText.style.display = 'block';
        outputText.style.borderColor = isError ? '#ef4444' : '#3b82f6';
        setTimeout(() => { outputText.style.display = 'none'; }, 4000);
    };

    // --- Feed Functions ---

    const loadFeed = async () => {
        const { data, error } = await _supabase
            .from('posts')
            .select(`
                id, content, created_at, 
                profiles (username, full_name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            feedContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            return;
        }

        if (data.length === 0) {
            feedContainer.innerHTML = '<p style="text-align: center; color: #666; margin-top: 2rem;">No posts yet. Be the first!</p>';
            return;
        }

        feedContainer.innerHTML = data.map(post => `
            <div class="post-card">
                <div class="post-header">
                    <div class="avatar-placeholder"></div>
                    <div>
                        <strong>${post.profiles.full_name}</strong>
                        <small style="color: #3b82f6; display: block;">@${post.profiles.username}</small>
                    </div>
                </div>
                <div class="post-content">${post.content}</div>
                <div class="post-meta">${new Date(post.created_at).toLocaleString()}</div>
            </div>
        `).join('');
    };

    const loadDiscovery = async (currentUserId) => {
        const { data } = await _supabase.from('profiles').select('id, username, full_name').neq('id', currentUserId).limit(5);
        if (data) {
            profilesList.innerHTML = data.map(p => `
                <div class="user-item">
                    <div class="avatar-placeholder"></div>
                    <div style="flex: 1;">
                        <p style="font-weight: 600; font-size: 0.9rem;">${p.full_name}</p>
                        <small style="color: #3b82f6;">@${p.username}</small>
                    </div>
                    <button style="padding: 0.25rem 0.5rem; font-size: 0.7rem; background: transparent; border: 1px solid #3b82f6; color: #3b82f6;">Follow</button>
                </div>
            `).join('');
        }
    };

    // --- Auth Logic ---

    const updateAuthUI = async (session) => {
        if (session) {
            showView('profile');
            statusText.textContent = `Signed in as: ${session.user.email}`;

            // Fetch profile
            const { data: profile } = await _supabase.from('profiles').select('username, full_name').eq('id', session.user.id).single();
            if (profile) {
                profileName.textContent = profile.full_name;
                profileUsername.textContent = '@' + profile.username;
            }

            loadFeed();
            loadDiscovery(session.user.id);
        } else {
            showView('login');
        }
    };

    _supabase.auth.onAuthStateChange((event, session) => updateAuthUI(session));

    // --- Interaction Logic ---

    btnPostSubmit.addEventListener('click', async () => {
        const content = postContent.value.trim();
        if (!content) return showToast('Post cannot be empty', true);

        const { data: { user } } = await _supabase.auth.getUser();
        const { error } = await _supabase.from('posts').insert([
            { content, user_id: user.id }
        ]);

        if (error) {
            showToast(error.message, true);
        } else {
            postContent.value = '';
            showToast('Post shared!');
            loadFeed(); // Refresh feed
        }
    });

    btnLoginSubmit.addEventListener('click', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const { error } = await _supabase.auth.signInWithPassword({ email, password });
        if (error) showToast(error.message, true);
    });

    btnRegisterSubmit.addEventListener('click', async () => {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const uniqueId = crypto.randomUUID().split('-')[0];
        const { error } = await _supabase.auth.signUp({
            email, password, options: { data: { full_name: 'Douroob user', username: `user_${uniqueId}` } }
        });
        if (error) showToast(error.message, true);
        else showToast('Registration successful! Login now.');
    });

    btnLogout.addEventListener('click', () => _supabase.auth.signOut());

    document.getElementById('go-to-register').addEventListener('click', () => showView('register'));
    document.getElementById('go-to-login').addEventListener('click', () => showView('login'));
});
