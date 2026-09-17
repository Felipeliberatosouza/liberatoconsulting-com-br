ALTER TABLE public.tool_user_profiles
  ADD COLUMN IF NOT EXISTS receive_newsletter boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS receive_bulletin boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS receive_insights boolean NOT NULL DEFAULT true;

GRANT SELECT, INSERT, UPDATE ON public.tool_user_profiles TO authenticated;
GRANT ALL ON public.tool_user_profiles TO service_role;

DROP POLICY IF EXISTS "Users can read own tool profile" ON public.tool_user_profiles;
CREATE POLICY "Users can read own tool profile"
ON public.tool_user_profiles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own tool profile" ON public.tool_user_profiles;
CREATE POLICY "Users can create own tool profile"
ON public.tool_user_profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tool profile" ON public.tool_user_profiles;
CREATE POLICY "Users can update own tool profile"
ON public.tool_user_profiles
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);