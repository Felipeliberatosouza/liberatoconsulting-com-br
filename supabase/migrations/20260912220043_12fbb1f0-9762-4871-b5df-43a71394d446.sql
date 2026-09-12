select cron.schedule(
  'crm-birthdays-daily-08',
  '0 11 * * *',
  $$SELECT net.http_post(
      url := 'https://liberatoconsulting.com.br/api/public/crm-birthdays',
      headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(SELECT value FROM app_private.dispatch_secret WHERE name = 'cron')),
      body := '{"source":"cron"}'::jsonb
    ) as request_id;$$
);