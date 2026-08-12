CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'bulletin-weekly',
  '0 13 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://project--4889a4be-87a4-4450-9bd7-7b20cfa78e6b.lovable.app/api/public/bulletin-weekly',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_D597YNcVGLGr0b4_fUfe9g_x9RtRvzr"}'::jsonb,
    body := '{"source":"cron"}'::jsonb
  ) as request_id;
  $$
);