-- Ensure the storage schema exists (it should, but just in case)
create schema if not exists storage;

-- Create the bucket if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts', 
  'receipts', 
  true, 
  5242880, -- 5MB limit
  '{image/*, application/pdf}'
)
on conflict (id) do update set 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = '{image/*, application/pdf}';

-- Ensure RLS is enabled on objects
alter table storage.objects enable row level security;

-- Drop existing policies to avoid conflicts/duplication
drop policy if exists "Authenticated users can upload receipts" on storage.objects;
drop policy if exists "Users can view receipts" on storage.objects;
drop policy if exists "Users can update own receipts" on storage.objects;
drop policy if exists "Users can delete own receipts" on storage.objects;

-- Re-create policies
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
