CREATE TABLE public.member_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL,
  ref_id text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  path text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX member_activity_events_user_idx ON public.member_activity_events (user_id, created_at DESC);
GRANT SELECT, INSERT ON public.member_activity_events TO authenticated;
GRANT ALL ON public.member_activity_events TO service_role;
ALTER TABLE public.member_activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users log own activity" ON public.member_activity_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read activity" ON public.member_activity_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));