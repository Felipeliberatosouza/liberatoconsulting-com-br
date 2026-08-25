ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_phone_br_format_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_phone_br_format_check
  CHECK (phone = '' OR phone ~ '^\+55 \([1-9][0-9]\) [0-9]{4}-[0-9]{4}$') NOT VALID;

ALTER TABLE public.job_applications
  DROP CONSTRAINT IF EXISTS job_applications_phone_br_format_check;

ALTER TABLE public.job_applications
  ADD CONSTRAINT job_applications_phone_br_format_check
  CHECK (phone ~ '^\+55 \([1-9][0-9]\) [0-9]{4}-[0-9]{4}$') NOT VALID;