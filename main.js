// main.js - Vanilla JS Supabase Social Clone

const SUPABASE_URL = 'https://csopcjxlibyruzgsftbl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DRslmDUWe88N7VToYOTDWA_rdLhZWzt';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // 1. UI Element Selectors
    const authViews = document.getElementById('auth-views');
    const appHeader = document.getElementById('app-header');
    const mainView = document.getElementById('user-info');
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    
    const profileName = document.getElementById('profile-name');
    const profileUsername = document.getElementById('profile-username');
    const profilesList = document.getElementById('profiles-list');
    const feedContainer = document.getElementById('feed-container');
    const postContent = document.getElementById('post-content');
    
    const statusText = document.getElementById('status');
    const outputText = document.getElementById('output');

    const btnLoginSubmit = document.getElementById('btn-login-submit');
    const btnRegisterSubmit = document.getElementById('btn-register-submit');
    const btnPostSubmit = document.getElementById('btn-post-submit');
    const btnLogout = document.getElementById('btn-logout');

    // 2. Helper Functions
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
    };

    const showToast = (message, isError = false) => {
        outputText.textContent = message;
        outputText.style.display = 'block';
        outputText.style.borderColor = isError ? '#ef4444' : '#3b82f6';
        outputText.style.color = isError ? '#ef4444' : '#e0e0e0';
        console.log(isError ? 'Error:' : 'Info:', message);
        setTimeout(() => { outputText.style.display = 'none'; }, 5000);
    };

    // 3. Data Fetching Functions
    const loadFeed = async () => {
        try {
            feedContainer.innerHTML = '<p style="text-align: center; color: #666;">Refreshing feed...</p>';
            
            const { data, error } = await _supabase
                .from('posts')
                .select(`
                    id, content, created_at, 
                    profiles (username, full_name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                feedContainer.innerHTML = '<p style="text-align: center; color: #666; margin-top: 2rem;">No posts yet. Be the first!</p>';
                return;
            }

            feedContainer.innerHTML = data.map(post => `
                <div class="post-card">
                    <div class="post-header">
                        <div class="avatar-placeholder"></div>
                        <div>
                            <strong>${post.profiles?.full_name || 'Unknown User'}</strong>
                            <small style="color: #3b82f6; display: block;">@${post.profiles?.username || 'unknown'}</small>
                        </div>
                    </div>
                    <div class="post-content">${post.content}</div>
                    <div class="post-meta">${new Date(post.created_at).toLocaleString()}</div>
                </div>
            `).join('');
        } catch (err) {
            console.error('Feed Error:', err);
            feedContainer.innerHTML = `<p style="color: #ef4444; text-align: center;">Failed to load feed: ${err.message}</p>`;
        }
    };

    const loadDiscovery = async (currentUserId) => {
        const { data, error } = await _supabase
            .from('profiles')
            .select('id, username, full_name')
            .neq('id', currentUserId)
            .limit(5);
        
        if (error) return console.error('Discovery Error:', error);

        profilesList.innerHTML = (data || []).map(p => `
            <div class="user-item">
                <div class="avatar-placeholder"></div>
                <div style="flex: 1;">
                    <p style="font-weight: 600; font-size: 0.9rem;">${p.full_name}</p>
                    <small style="color: #3b82f6;">@${p.username}</small>
                </div>
                <button style="padding: 0.25rem 0.5rem; font-size: 0.7rem; background: transparent; border: 1px solid #3b82f6; color: #3b82f6;">Follow</button>
            </div>
        `).join('') || '<p style="color: #666; font-size: 0.8rem;">No other users found.</p>';
    };

    // 4. Auth Management
    const updateAuthUI = async (session) => {
        if (session?.user) {
            showView('profile');
            statusText.textContent = `Signed in as: ${session.user.email}`;

            // Get profile details
            const { data: profile, error } = await _supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                profileName.textContent = profile.full_name;
                profileUsername.textContent = '@' + profile.username;
            } else if (error) {
                console.error('Profile fetch error:', error);
            }

            loadFeed();
            loadDiscovery(session.user.id);
        } else {
            showView('login');
        }
    };

    // 5. Attach Event Listeners FIRST
    btnPostSubmit.addEventListener('click', async () => {
        const content = postContent.value.trim();
        if (!content) return showToast('Post cannot be empty', true);

        const { data: { session } } = await _supabase.auth.getSession();
        if (!session) return showToast('Session expired. Please log in again.', true);

        const { error } = await _supabase.from('posts').insert([
            { content, user_id: session.user.id }
        ]);

        if (error) {
            showToast(error.message, true);
        } else {
            postContent.value = '';
            showToast('Post shared!');
            loadFeed();
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

    btnLogout.addEventListener('click', async () => {
        await _supabase.auth.signOut();
    });

    document.getElementById('go-to-register').addEventListener('click', () => showView('register'));
    document.getElementById('go-to-login').addEventListener('click', () => showView('login'));

    // 6. Initialize Auth State
    _supabase.auth.onAuthStateChange((_event, session) => {
        updateAuthUI(session);
    });

    // Final manual check to ensure UI reflects current session on load
    const { data: { session } } = await _supabase.auth.getSession();
    updateAuthUI(session);
});
