-- Add receipt_url to expenses if it doesn't exist
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'expenses' and column_name = 'receipt_url') then
    alter table public.expenses add column receipt_url text;
  end if;
end $$;

-- Create storage bucket for receipts if it doesn't exist
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Set up storage policies
create policy "Authenticated users can upload receipts"
on storage.objects for insert
with check ( bucket_id = 'receipts' and auth.role() = 'authenticated' );

create policy "Users can view receipts"
on storage.objects for select
using ( bucket_id = 'receipts' );

create policy "Users can update own receipts"
on storage.objects for update
using ( bucket_id = 'receipts' and auth.uid() = owner );

create policy "Users can delete own receipts"
on storage.objects for delete
using ( bucket_id = 'receipts' and auth.uid() = owner );
