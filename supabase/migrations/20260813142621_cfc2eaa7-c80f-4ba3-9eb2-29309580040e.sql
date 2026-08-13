-- 1. Move a verificação de admin para um schema interno (não exposto na API)
CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'::app_role
  )
$$;

REVOKE ALL ON FUNCTION app_private.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.is_admin(uuid) TO authenticated, service_role;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

-- 2. Políticas passam a usar a função interna
DROP POLICY IF EXISTS "Admins gerenciam consultores" ON public.consultants;
CREATE POLICY "Admins gerenciam consultores" ON public.consultants
  FOR ALL TO authenticated
  USING (app_private.is_admin(auth.uid()))
  WITH CHECK (app_private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view bulletin dispatches" ON public.bulletin_dispatches;
CREATE POLICY "Admins can view bulletin dispatches" ON public.bulletin_dispatches
  FOR SELECT TO authenticated
  USING (app_private.is_admin(auth.uid()));

DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- 3. Funções de agenda: checagem interna via app_private, acesso só ao servidor
CREATE OR REPLACE FUNCTION public.get_weekly_schedules()
RETURNS TABLE(job_name text, schedule text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT j.jobname::text, j.schedule::text
    FROM cron.job j
    WHERE j.jobname IN ('bulletin-weekly-mon-10', 'newsletter-weekly-wed-10');
END;
$$;

REVOKE ALL ON FUNCTION public.get_weekly_schedules() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_schedules() TO service_role;

CREATE OR REPLACE FUNCTION public.set_weekly_schedule(_job text, _schedule text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  jid bigint;
BEGIN
  IF _job NOT IN ('bulletin-weekly-mon-10', 'newsletter-weekly-wed-10') THEN
    RAISE EXCEPTION 'Invalid job';
  END IF;
  IF _schedule !~ '^[0-9]{1,2} [0-9]{1,2} \* \* [0-6]$' THEN
    RAISE EXCEPTION 'Invalid schedule';
  END IF;
  SELECT j.jobid INTO jid FROM cron.job j WHERE j.jobname = _job;
  IF jid IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;
  PERFORM cron.alter_job(jid, schedule => _schedule);
END;
$$;

REVOKE ALL ON FUNCTION public.set_weekly_schedule(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_weekly_schedule(text, text) TO service_role;

-- 4. Listagem pública de consultores: chamada apenas pelo servidor do site
REVOKE ALL ON FUNCTION public.list_public_consultants() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_consultants() TO service_role;

REVOKE ALL ON FUNCTION public.verify_cron_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_cron_secret(text) TO service_role;