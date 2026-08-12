CREATE SCHEMA IF NOT EXISTS app_private;

CREATE TABLE IF NOT EXISTS app_private.dispatch_secret (
  name text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_private.dispatch_secret ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.dispatch_secret FROM PUBLIC, anon, authenticated;
GRANT SELECT ON app_private.dispatch_secret TO service_role;

INSERT INTO app_private.dispatch_secret (name, value)
VALUES ('cron', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;

DO $do$
DECLARE
  j record;
  base_url text := 'https://project--4889a4be-87a4-4450-9bd7-7b20cfa78e6b.lovable.app/api/public/';
  endpoint text;
BEGIN
  FOR j IN SELECT jobid, jobname FROM cron.job
           WHERE jobname IN ('bulletin-weekly', 'bulletin-weekly-mon-10', 'newsletter-weekly', 'newsletter-weekly-wed-10')
  LOOP
    endpoint := CASE WHEN j.jobname LIKE 'bulletin%' THEN 'bulletin-weekly' ELSE 'newsletter-weekly' END;
    PERFORM cron.alter_job(
      j.jobid,
      command => format(
        $cmd$SELECT net.http_post(
          url := %L,
          headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(SELECT value FROM app_private.dispatch_secret WHERE name = 'cron')),
          body := '{"source":"cron"}'::jsonb
        ) as request_id;$cmd$,
        base_url || endpoint
      )
    );
  END LOOP;
END
$do$;