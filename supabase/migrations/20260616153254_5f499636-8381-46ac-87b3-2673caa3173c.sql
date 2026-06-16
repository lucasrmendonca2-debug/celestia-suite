CREATE POLICY "rank banners public read" ON storage.objects FOR SELECT USING (bucket_id = 'rank-banners');
CREATE POLICY "rank banners auth insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'rank-banners');
CREATE POLICY "rank banners auth update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'rank-banners');
CREATE POLICY "rank banners auth delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'rank-banners');