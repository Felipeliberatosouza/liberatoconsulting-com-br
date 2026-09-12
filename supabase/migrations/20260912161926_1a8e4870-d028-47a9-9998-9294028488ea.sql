ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_phone_br_format_check;

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_phone_international_format_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_phone_international_format_check
  CHECK (
    phone = '' OR (
      phone ~ '^\+[0-9 ()-]+$'
      AND length(regexp_replace(phone, '[^0-9]', '', 'g')) BETWEEN 8 AND 15
      AND (
        regexp_replace(phone, '[^0-9]', '', 'g') !~ '^55'
        OR regexp_replace(phone, '[^0-9]', '', 'g') ~ '^55[1-9][0-9]9[0-9]{8}$'
      )
    )
  ) NOT VALID;

ALTER TABLE public.job_applications
  DROP CONSTRAINT IF EXISTS job_applications_phone_br_format_check;

ALTER TABLE public.job_applications
  DROP CONSTRAINT IF EXISTS job_applications_phone_international_format_check;

ALTER TABLE public.job_applications
  ADD CONSTRAINT job_applications_phone_international_format_check
  CHECK (
    phone ~ '^\+[0-9 ()-]+$'
    AND length(regexp_replace(phone, '[^0-9]', '', 'g')) BETWEEN 8 AND 15
    AND (
      regexp_replace(phone, '[^0-9]', '', 'g') !~ '^55'
      OR regexp_replace(phone, '[^0-9]', '', 'g') ~ '^55[1-9][0-9]9[0-9]{8}$'
    )
  ) NOT VALID;