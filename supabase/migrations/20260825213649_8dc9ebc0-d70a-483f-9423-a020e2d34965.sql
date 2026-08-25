CREATE POLICY "Backend manages leads"
ON public.leads
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Backend manages job applications"
ON public.job_applications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);