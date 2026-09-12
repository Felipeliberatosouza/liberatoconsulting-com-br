DROP POLICY IF EXISTS "Panel users manage quotes" ON public.quotes;
CREATE POLICY "Admins manage quotes" ON public.quotes FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Panel users manage service pricing" ON public.service_pricing;
CREATE POLICY "Admins manage service pricing" ON public.service_pricing FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'admin'::public.app_role));