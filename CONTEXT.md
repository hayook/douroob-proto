# Project Context: Douroob Social (Supabase Prototype)

## Overview
A minimal "Social Media Clone" prototype built to test Supabase integration using Vanilla JavaScript, HTML, and CSS. The project focuses on practical implementation of the Supabase SDK for Auth and Database operations.

## Tech Stack
- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (ES Modules).
- **Backend:** Supabase (PostgreSQL, Auth, RLS).
- **CDN:** Supabase JS SDK v2 via JSDelivr.

## Current Implementation State

### 1. Authentication
- **Provider:** Email/Password (Email confirmation disabled for dev speed).
- **Views:** Separate Login and Registration forms with a toggle mechanism.
- **State Management:** `onAuthStateChange` listener handles UI transitions between Auth and Home views.

### 2. Profiles Table (`profiles`)
- **Schema:** `id (uuid, PK)`, `username (text, unique)`, `full_name (text)`.
- **Automation:** A Supabase Trigger (`handle_new_user`) automatically creates a profile entry upon Auth signup.
- **Default Data:** Users are registered with a default name "Douroob user" and a unique `user_<short_uuid>` handle.
- **RLS:** Publicly readable; updateable only by the owner.

### 3. Posts Table (`posts`)
- **Schema:** `id (uuid, PK)`, `content (text)`, `user_id (references profiles.id)`, `created_at (timestamp)`.
- **Features:** "Create Post" composer and a global "Home Feed" sorted by newest.
- **RLS:** Publicly readable; insertable only by authenticated owners.

### 4. UI/Layout
- **Theme:** Dark mode (#121212 background, #3b82f6 primary accents).
- **Layout:** Classic 3-column desktop layout (Left: Profile/Logout, Center: Feed, Right: Discovery/Who to Follow).
- **Responsiveness:** Sidebars hide on mobile/tablet views.

## Connection Details
- **URL:** `https://csopcjxlibyruzgsftbl.supabase.co`
- **Key:** `sb_publishable_DRslmDUWe88N7VToYOTDWA_rdLhZWzt`

## Future Goals / Roadmap
1. **Profile Editing:** Allow users to change their `full_name` and `username`.
2. **Engagement:** Implement "Likes" and "Comments" (requires new tables and RLS).
3. **Social Graph:** Implement a "Following" system to filter the feed to followed users only.
4. **Media:** Support for image uploads via Supabase Storage.
5. **Real-time:** Use Supabase Realtime to update the feed instantly when new posts are created.

## Key Files
- `index.html`: Main structure and view containers.
- `style.css`: Dark theme and 3-column grid layout.
- `main.js`: Supabase initialization, Auth logic, and Feed/Profile fetching.
