-- 1) Contract templates: restrict reads to the requesting user's own audience
DROP POLICY IF EXISTS "contracts read authenticated" ON public.contract_templates;
CREATE POLICY "contracts read own audience" ON public.contract_templates
  FOR SELECT TO authenticated
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text = contract_templates.audience
    )
  );

-- 2) Move SECURITY DEFINER helpers out of the API-exposed schema
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA app_private;
ALTER FUNCTION public.set_updated_at() SET SCHEMA app_private;

REVOKE ALL ON FUNCTION app_private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.set_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app_private.set_updated_at() TO service_role;