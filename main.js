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
        setTimeout(() => { outputText.style.display = 'none'; }, 5000);
    };

    // --- Notification Logic ---
    const showNotificationCard = (message) => {
        const container = document.getElementById('notification-container');
        const card = document.createElement('div');
        card.style.cssText = `
            background: #1e1e1e;
            color: #fff;
            border-left: 4px solid #3b82f6;
            border-top: 1px solid #333;
            border-bottom: 1px solid #333;
            border-right: 1px solid #333;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.6);
            min-width: 280px;
            pointer-events: auto;
            transform: translateX(-120%);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex;
            align-items: center;
            gap: 12px;
        `;
        
        card.innerHTML = `
            <div style="font-size: 1.5rem;">🔔</div>
            <div style="flex: 1;">
                <div style="font-weight: 700; color: #fff;">Notification</div>
                <div style="font-size: 0.9rem; color: #888; margin-top: 2px;">${message}</div>
            </div>
        `;
        
        container.appendChild(card);
        setTimeout(() => {
            card.style.transform = 'translateX(0)';
            card.style.opacity = '1';
        }, 10);

        setTimeout(() => {
            card.style.transform = 'translateX(-120%)';
            card.style.opacity = '0';
            setTimeout(() => card.remove(), 500);
        }, 5000);
    };

    const setupNotifications = (userId) => {
        _supabase
            .channel(`notifications-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                async (payload) => {
                    const { data: actor } = await _supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('id', payload.new.actor_id)
                        .single();
                    
                    const name = actor?.full_name || 'Someone';
                    if (payload.new.type === 'like') {
                        showNotificationCard(`${name} liked your post!`);
                    } else if (payload.new.type === 'follow') {
                        showNotificationCard(`${name} started following you!`);
                    }
                }
            )
            .subscribe();
    };

    // --- Follow Logic ---
    const toggleFollow = async (targetUserId, currentUserId, isFollowing) => {
        try {
            if (isFollowing) {
                await _supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', targetUserId);
            } else {
                await _supabase.from('follows').insert([{ follower_id: currentUserId, following_id: targetUserId }]);
            }
            loadDiscovery(currentUserId);
        } catch (err) {
            console.error('Follow Error:', err);
        }
    };

    // --- Like Logic ---
    const toggleLike = async (postId, currentUserId, isLiked) => {
        try {
            if (isLiked) {
                await _supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
            } else {
                await _supabase.from('likes').insert([{ post_id: postId, user_id: currentUserId }]);
            }
            loadFeed();
        } catch (err) {
            console.error('Like Error:', err);
        }
    };

    // 3. Data Fetching Functions
    const loadFeed = async () => {
        try {
            const { data: { session } } = await _supabase.auth.getSession();
            const currentUserId = session?.user?.id;

            const { data, error } = await _supabase
                .from('posts')
                .select(`
                    id, content, created_at, 
                    profiles (username, full_name),
                    likes (user_id)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                feedContainer.innerHTML = '<p style="text-align: center; color: #666; margin-top: 2rem;">No posts yet. Be the first!</p>';
                return;
            }

            feedContainer.innerHTML = '';
            data.forEach(post => {
                const likes = post.likes || [];
                const isLikedByMe = currentUserId ? likes.some(l => l.user_id === currentUserId) : false;
                
                const card = document.createElement('div');
                card.className = 'post-card';
                card.innerHTML = `
                    <div class="post-header">
                        <div class="avatar-placeholder"></div>
                        <div>
                            <strong>${post.profiles?.full_name || 'Unknown User'}</strong>
                            <small style="color: #3b82f6; display: block;">@${post.profiles?.username || 'unknown'}</small>
                        </div>
                    </div>
                    <div class="post-content">${post.content}</div>
                    <div class="post-meta">
                        <span>${new Date(post.created_at).toLocaleString()}</span>
                        <button class="like-button ${isLikedByMe ? 'active' : ''}">
                            ${isLikedByMe ? '❤️' : '🤍'} ${likes.length}
                        </button>
                    </div>
                `;

                const likeBtn = card.querySelector('.like-button');
                likeBtn.addEventListener('click', () => {
                    if (!currentUserId) return showToast('Please log in to like posts', true);
                    toggleLike(post.id, currentUserId, isLikedByMe);
                });

                feedContainer.appendChild(card);
            });
        } catch (err) {
            console.error('Feed Error:', err);
            feedContainer.innerHTML = `<p style="color: #ef4444; text-align: center;">Failed to load feed: ${err.message}</p>`;
        }
    };

    const loadDiscovery = async (currentUserId) => {
        try {
            // Fetch profiles and whether current user follows them
            const { data: profiles, error } = await _supabase
                .from('profiles')
                .select(`
                    id, username, full_name,
                    follows:follows!following_id (follower_id)
                `)
                .neq('id', currentUserId)
                .limit(5);
            
            if (error) throw error;

            profilesList.innerHTML = (profiles || []).map(p => {
                const isFollowing = p.follows.some(f => f.follower_id === currentUserId);
                return `
                    <div class="user-item">
                        <div class="avatar-placeholder"></div>
                        <div style="flex: 1;">
                            <p style="font-weight: 600; font-size: 0.9rem;">${p.full_name}</p>
                            <small style="color: #3b82f6;">@${p.username}</small>
                        </div>
                        <button class="follow-btn" data-id="${p.id}" data-following="${isFollowing}" style="padding: 0.25rem 0.5rem; font-size: 0.7rem; background: ${isFollowing ? 'transparent' : '#3b82f6'}; border: 1px solid #3b82f6; color: ${isFollowing ? '#3b82f6' : 'white'};">
                            ${isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                    </div>
                `;
            }).join('') || '<p style="color: #666; font-size: 0.8rem;">No other users found.</p>';

            // Attach listeners to follow buttons
            document.querySelectorAll('.follow-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetId = btn.dataset.id;
                    const isFollowing = btn.dataset.following === 'true';
                    toggleFollow(targetId, currentUserId, isFollowing);
                });
            });

        } catch (err) {
            console.error('Discovery Error:', err);
        }
    };

    // 4. Auth Management
    let notificationSetupDone = false;
    const updateAuthUI = async (session) => {
        if (session?.user) {
            showView('profile');
            statusText.textContent = `Signed in as: ${session.user.email}`;

            const { data: profile } = await _supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                profileName.textContent = profile.full_name;
                profileUsername.textContent = '@' + profile.username;
            }

            loadFeed();
            loadDiscovery(session.user.id);
            
            if (!notificationSetupDone) {
                setupNotifications(session.user.id);
                notificationSetupDone = true;
            }
        } else {
            showView('login');
            notificationSetupDone = false;
        }
    };

    // 5. Attach Event Listeners
    btnPostSubmit.addEventListener('click', async () => {
        const content = postContent.value.trim();
        if (!content) return showToast('Post cannot be empty', true);

        const { data: { session } } = await _supabase.auth.getSession();
        if (!session) return showToast('Session expired. Please log in again.', true);

        const { error } = await _supabase.from('posts').insert([{ content, user_id: session.user.id }]);

        if (error) showToast(error.message, true);
        else {
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

    const { data: { session } } = await _supabase.auth.getSession();
    updateAuthUI(session);
});
