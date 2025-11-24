-- Create expenses table
create table if not exists public.expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  description text not null,
  amount numeric not null, -- Net amount before tax
  mva_rate integer default 25, -- Tax rate in percentage (e.g., 25)
  mva_amount numeric not null, -- Tax amount
  total_amount numeric not null, -- Gross amount (amount + mva_amount)
  currency text default 'NOK',
  invoice_number text,
  invoice_date date default CURRENT_DATE,
  due_date date,
  type text not null check (type in ('payable', 'receivable')), -- payable = I owe, receivable = owed to me
  status text default 'pending' check (status in ('pending', 'paid', 'overdue')),
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.expenses enable row level security;

-- Policies
drop policy if exists "Users can view own expenses" on public.expenses;
create policy "Users can view own expenses" on public.expenses for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own expenses" on public.expenses;
create policy "Users can insert own expenses" on public.expenses for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own expenses" on public.expenses;
create policy "Users can update own expenses" on public.expenses for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own expenses" on public.expenses;
create policy "Users can delete own expenses" on public.expenses for delete using (auth.uid() = user_id);
