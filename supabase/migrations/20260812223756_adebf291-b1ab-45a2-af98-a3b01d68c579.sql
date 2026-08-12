-- 1) Consultants: remove overly permissive authenticated read
DROP POLICY IF EXISTS "Equipe autenticada pode ver consultores" ON public.consultants;

-- 2) Lock down SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.list_public_consultants() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_consultants() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_weekly_schedules()
RETURNS TABLE(job_name text, schedule text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT j.jobname::text, j.schedule::text
    FROM cron.job j
    WHERE j.jobname IN ('bulletin-weekly-mon-10', 'newsletter-weekly-wed-10');
END;
$$;

REVOKE ALL ON FUNCTION public.get_weekly_schedules() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_weekly_schedules() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.set_weekly_schedule(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_weekly_schedule(text, text) TO authenticated, service_role;
