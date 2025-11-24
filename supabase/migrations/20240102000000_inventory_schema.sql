-- Create items table
create table if not exists public.items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  image_url text, -- Placeholder for now
  rarity text default 'common', -- common, rare, epic, legendary
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create inventory table
create table if not exists public.inventory (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  item_id uuid references public.items not null,
  quantity integer default 1,
  acquired_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, item_id)
);

-- Enable RLS
alter table public.items enable row level security;
alter table public.inventory enable row level security;

-- Policies for items (Public read, Admin write - for now just public read)
drop policy if exists "Everyone can view items" on public.items;
create policy "Everyone can view items" on public.items for select using (true);

-- Policies for inventory
drop policy if exists "Users can view own inventory" on public.inventory;
create policy "Users can view own inventory" on public.inventory for select using (auth.uid() = user_id);
drop policy if exists "Users can add to own inventory" on public.inventory;
create policy "Users can add to own inventory" on public.inventory for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own inventory" on public.inventory;
create policy "Users can update own inventory" on public.inventory for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own inventory" on public.inventory;
create policy "Users can delete own inventory" on public.inventory for delete using (auth.uid() = user_id);

-- Seed initial items
insert into public.items (name, description, rarity, image_url) values
('Wooden Sword', 'A basic training sword.', 'common', 'https://placehold.co/100x100/8B4513/FFFFFF?text=Sword'),
('Iron Shield', 'Sturdy defense against minor threats.', 'common', 'https://placehold.co/100x100/708090/FFFFFF?text=Shield'),
('Health Potion', 'Restores vitality after a long session.', 'common', 'https://placehold.co/100x100/FF0000/FFFFFF?text=Potion'),
('Golden Chalice', 'A reward for a true champion.', 'rare', 'https://placehold.co/100x100/FFD700/000000?text=Chalice'),
('Mystic Amulet', 'Humming with unknown energy.', 'epic', 'https://placehold.co/100x100/800080/FFFFFF?text=Amulet'),
('Developer Keyboard', 'The ultimate weapon of creation.', 'legendary', 'https://placehold.co/100x100/000000/00FF00?text=Keyboard');
