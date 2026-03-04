 -- Create a table for public profiles
create table profiles (
       id uuid references auth.users on delete cascade not null primary key,
       updated_at timestamp with time zone,
       username text unique,
       full_name text,
       avatar_url text,
       website text,
    
      constraint username_length check (char_length(username) >= 3)
    );

-- Set up Row Level Security (RLS)
alter table profiles
      enable row level security;
   
    create policy "Public profiles are viewable by everyone." on profiles
      for select using (true);
   
    create policy "Users can insert their own profile." on profiles
      for insert with check (auth.uid() = id);
   
    create policy "Users can update own profile." on profiles
      for update using (auth.uid() = id);


-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
    -- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
    create function public.handle_new_user()
    returns trigger as $$
    begin
      insert into public.profiles (id, username, full_name, avatar_url)
      values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
      return new;
    end;
    $$ language plpgsql security definer;
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();


-- Create the posts table
     create table public.posts (
       id uuid default gen_random_uuid() primary key,
       created_at timestamp with time zone default now() not null,
       content text not null check (char_length(content) > 0),
       user_id uuid references public.profiles(id) on delete cascade not null
     );
    
 -- Enable Row Level Security (RLS)
    alter table public.posts enable row level security;
   
    -- Policy: Anyone can see any post
    create policy "Posts are viewable by everyone"
    on public.posts for select
    using (true);
   
    -- Policy: Only authenticated users can create posts (as themselves)
    create policy "Users can create their own posts"
    on public.posts for insert
    with check (auth.uid() = user_id);



 -- Create the likes table
     create table public.likes (
       id uuid default gen_random_uuid() primary key,
       created_at timestamp with time zone default now() not null,
       post_id uuid references public.posts(id) on delete cascade not null,
       user_id uuid references public.profiles(id) on delete cascade not null,
    
       -- Prevent a user from liking the same post more than once
       unique (post_id, user_id)
    );
   
    -- Enable Row Level Security (RLS)
    alter table public.likes enable row level security;
   
    -- Policy: Anyone can see likes (needed to count them)
    create policy "Likes are viewable by everyone"
    on public.likes for select
    using (true);

 -- Policy: Only authenticated users can like a post
    create policy "Users can like posts"
    on public.likes for insert
    with check (auth.uid() = user_id);
   
    -- Policy: Only the user who liked a post can remove their like
    create policy "Users can unlike posts"
    on public.likes for delete
    using (auth.uid() = user_id);



 -- Create notifications table
     create table public.notifications (
       id uuid default gen_random_uuid() primary key,
       created_at timestamp with time zone default now() not null,
       user_id uuid references public.profiles(id) on delete cascade not null, -- The receiver (post owner)
       actor_id uuid references public.profiles(id) on delete cascade not null, -- The person who liked
       post_id uuid references public.posts(id) on delete cascade not null,    -- The post liked
       type text not null, -- e.g., 'like'
       is_read boolean default false
    );
   
    -- Enable Row Level Security
    alter table public.notifications enable row level security;

 -- Policy: Users can only see their own notifications
    create policy "Users can view their own notifications"
    on public.notifications for select
    using (auth.uid() = user_id);
   
    -- Policy: Users can update their own notifications (to mark as read)
    create policy "Users can update their own notifications"
    on public.notifications for update
    using (auth.uid() = user_id);

 -- Function to handle like notifications
     create or replace function public.handle_like_notification()
     returns trigger as $$
     declare
       post_owner_id uuid;
     begin
       -- Find the owner of the post that was liked
       select user_id into post_owner_id from public.posts where id = new.post_id;
    
      -- Only create notification if the liker is NOT the post owner
      if post_owner_id != new.user_id then
        insert into public.notifications (user_id, actor_id, post_id, type)
        values (post_owner_id, new.user_id, new.post_id, 'like');
      end if;
   
      return new;
    end;
    $$ language plpgsql security definer;
   
    -- Trigger the function after a like is inserted
    create trigger on_like_created
      after insert on public.likes
      for each row execute procedure public.handle_like_notification();

