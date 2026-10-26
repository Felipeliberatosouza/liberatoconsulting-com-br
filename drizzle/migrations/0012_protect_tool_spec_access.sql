ALTER POLICY "Signed-in users read published tools" ON public.interactive_tools TO authenticated USING (
 public.has_role(auth.uid(),'admin') OR (status='published' AND (
 pricing_mode='free' OR
 (pricing_mode='paid' AND EXISTS(SELECT 1 FROM public.interactive_tool_orders o WHERE o.tool_id=interactive_tools.id AND o.user_id=auth.uid() AND o.status='paid')) OR
 (pricing_mode='referral' AND EXISTS(SELECT 1 FROM public.tool_referrals r WHERE r.tool_id=interactive_tools.id AND r.user_id=auth.uid() AND r.state='accepted'))
 ))
);