CREATE OR REPLACE FUNCTION public.get_weekly_schedules()
RETURNS TABLE(job_name text, schedule text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, cron
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
    SELECT j.jobname::text, j.schedule::text
    FROM cron.job j
    WHERE j.jobname IN ('bulletin-weekly-mon-10', 'newsletter-weekly-wed-10');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_weekly_schedule(_job text, _schedule text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  jid bigint;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
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

REVOKE ALL ON FUNCTION public.get_weekly_schedules() FROM public, anon;
REVOKE ALL ON FUNCTION public.set_weekly_schedule(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_weekly_schedules() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_weekly_schedule(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_schedules() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_weekly_schedule(text, text) TO service_role;