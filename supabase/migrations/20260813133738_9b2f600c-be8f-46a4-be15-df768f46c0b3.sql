ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contract_file_path text,
  ADD COLUMN IF NOT EXISTS contract_file_name text,
  ADD COLUMN IF NOT EXISTS contract_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS contract_uploaded_at timestamptz;