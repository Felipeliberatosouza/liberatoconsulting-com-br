CREATE POLICY "resumes admin all" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'resumes' AND app_private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'resumes' AND app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "contracts admin all" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'contracts' AND app_private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'contracts' AND app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "contracts owner read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);