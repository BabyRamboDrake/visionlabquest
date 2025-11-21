-- Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create storylines table
create table public.storylines (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create quests table
create table public.quests (
  id uuid default uuid_generate_v4() primary key,
  storyline_id uuid references public.storylines on delete cascade not null,
  title text not null,
  completed boolean default false,
  parent_id uuid references public.quests on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_progress table
create table public.user_progress (
  user_id uuid references auth.users not null primary key,
  xp integer default 0,
  level integer default 1,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.storylines enable row level security;
alter table public.quests enable row level security;
alter table public.user_progress enable row level security;

-- Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view own storylines" on public.storylines for select using (auth.uid() = user_id);
create policy "Users can insert own storylines" on public.storylines for insert with check (auth.uid() = user_id);
create policy "Users can delete own storylines" on public.storylines for delete using (auth.uid() = user_id);

create policy "Users can view own quests" on public.quests for select using (
  exists (select 1 from public.storylines where id = public.quests.storyline_id and user_id = auth.uid())
);
create policy "Users can insert own quests" on public.quests for insert with check (
  exists (select 1 from public.storylines where id = public.quests.storyline_id and user_id = auth.uid())
);
create policy "Users can update own quests" on public.quests for update using (
  exists (select 1 from public.storylines where id = public.quests.storyline_id and user_id = auth.uid())
);
create policy "Users can delete own quests" on public.quests for delete using (
  exists (select 1 from public.storylines where id = public.quests.storyline_id and user_id = auth.uid())
);

create policy "Users can view own progress" on public.user_progress for select using (auth.uid() = user_id);
create policy "Users can update own progress" on public.user_progress for update using (auth.uid() = user_id);
create policy "Users can insert own progress" on public.user_progress for insert with check (auth.uid() = user_id);

-- Trigger to create profile and progress on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  
  insert into public.user_progress (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
