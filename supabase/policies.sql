-- شغلي ده مرة واحدة في Supabase SQL Editor
-- قراءة عامة للحسابات المتاحة فقط
create policy if not exists "public can view available safe accounts"
on public.game_accounts
for select
to anon
using (status = 'available');

-- قراءة عامة لصور حسابات الألعاب من Storage
-- مهم لو bucket account-images Private والصفحة للعميل بدون Login
create policy if not exists "public read account images"
on storage.objects
for select
to anon
using (bucket_id = 'account-images');
