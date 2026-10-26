CREATE TABLE public.tool_referrals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tool_id uuid NOT NULL REFERENCES public.interactive_tools(id) ON DELETE CASCADE,
 user_id uuid NOT NULL, slug text NOT NULL, channel text NOT NULL CHECK (channel IN ('email','whatsapp')),
 recipient text NOT NULL, recipient_hash text NOT NULL, token_hash text NOT NULL UNIQUE,
 state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','accepted','failed','unknown')),
 error text, created_at timestamptz NOT NULL DEFAULT now(), accepted_at timestamptz, used_at timestamptz,
 expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'), opted_out_at timestamptz,
 UNIQUE(tool_id,recipient_hash)
);
GRANT SELECT ON public.tool_referrals TO authenticated;
GRANT ALL ON public.tool_referrals TO service_role;
ALTER TABLE public.tool_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY referral_owner_read ON public.tool_referrals FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.tool_referral_blocks (
 recipient_hash text PRIMARY KEY, channel text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tool_referral_blocks TO service_role;
ALTER TABLE public.tool_referral_blocks ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.claim_tool_referral(p_hash text,p_slug text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t uuid;
BEGIN
 UPDATE public.tool_referrals r SET used_at=now() WHERE r.token_hash=p_hash AND r.slug=p_slug AND r.state='accepted' AND r.used_at IS NULL AND r.expires_at>now() AND EXISTS(SELECT 1 FROM public.interactive_tools it WHERE it.id=r.tool_id AND it.status='published') RETURNING r.tool_id INTO t;
 RETURN t;
END $$;
REVOKE ALL ON FUNCTION public.claim_tool_referral(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_tool_referral(text,text) TO service_role;
CREATE TABLE public.client_signing_packets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, kind text NOT NULL CHECK(kind IN ('nda','contract')),
 client_name text NOT NULL, client_cnpj text NOT NULL, document jsonb NOT NULL, document_hash text NOT NULL,
 unsigned_path text NOT NULL, annex_path text, annex_hash text, quote_id uuid REFERENCES public.quotes(id),
 nda_id uuid REFERENCES public.client_signing_packets(id), created_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz, expires_at timestamptz NOT NULL DEFAULT(now()+interval '30 days')
);
GRANT SELECT ON public.client_signing_packets TO authenticated;
GRANT ALL ON public.client_signing_packets TO service_role;
ALTER TABLE public.client_signing_packets ENABLE ROW LEVEL SECURITY;
CREATE POLICY signing_admin_read ON public.client_signing_packets FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE TABLE public.client_document_signers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), packet_id uuid NOT NULL REFERENCES public.client_signing_packets(id),
 role text NOT NULL CHECK(role IN ('client','consultant','witness1','witness2')), name text NOT NULL, cpf text NOT NULL, email text NOT NULL,
 token_hash text NOT NULL UNIQUE, invited_at timestamptz, invite_error text,
 code_hash text, code_expires_at timestamptz, code_sent_at timestamptz, code_attempts integer NOT NULL DEFAULT 0,
 signed_at timestamptz, ip text, user_agent text, signed_hash text,
 UNIQUE(packet_id,role), UNIQUE(packet_id,email)
);
GRANT SELECT ON public.client_document_signers TO authenticated;
GRANT ALL ON public.client_document_signers TO service_role;
ALTER TABLE public.client_document_signers ENABLE ROW LEVEL SECURITY;
CREATE POLICY signers_admin_read ON public.client_document_signers FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.freeze_signing_packet() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-'completed_at') IS DISTINCT FROM (to_jsonb(OLD)-'completed_at') THEN RAISE EXCEPTION 'Documento emitido é imutável'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER signing_packet_frozen BEFORE UPDATE OR DELETE ON public.client_signing_packets FOR EACH ROW EXECUTE FUNCTION public.freeze_signing_packet();
CREATE OR REPLACE FUNCTION public.freeze_document_signature() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF TG_OP='DELETE' OR OLD.signed_at IS NOT NULL THEN RAISE EXCEPTION 'Assinatura é imutável'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER document_signature_frozen BEFORE UPDATE OR DELETE ON public.client_document_signers FOR EACH ROW EXECUTE FUNCTION public.freeze_document_signature();
CREATE OR REPLACE FUNCTION public.issue_signing_code(p_id uuid,p_hash text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 UPDATE public.client_document_signers s SET code_hash=p_hash,code_expires_at=now()+interval '10 minutes',code_sent_at=now(),code_attempts=0
 WHERE s.id=p_id AND s.signed_at IS NULL AND (s.code_sent_at IS NULL OR s.code_sent_at<now()-interval '1 minute') AND EXISTS(SELECT 1 FROM public.client_signing_packets p WHERE p.id=s.packet_id AND p.expires_at>now());
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.issue_signing_code(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.issue_signing_code(uuid,text) TO service_role;
CREATE OR REPLACE FUNCTION public.accept_document_signature(p_id uuid,p_hash text,p_ip text,p_agent text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.client_document_signers; p public.client_signing_packets;
BEGIN
 SELECT * INTO s FROM public.client_document_signers WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RETURN 'invalid'; END IF;
 SELECT * INTO p FROM public.client_signing_packets WHERE id=s.packet_id;
 IF s.signed_at IS NOT NULL THEN RETURN 'signed'; END IF;
 IF p.expires_at<=now() OR s.code_expires_at IS NULL OR s.code_expires_at<=now() OR s.code_attempts>=5 THEN RETURN 'expired'; END IF;
 IF s.code_hash IS DISTINCT FROM p_hash THEN UPDATE public.client_document_signers SET code_attempts=code_attempts+1 WHERE id=s.id; RETURN 'invalid'; END IF;
 UPDATE public.client_document_signers SET signed_at=now(),ip=p_ip,user_agent=p_agent,signed_hash=p.document_hash,code_hash=NULL,code_expires_at=NULL WHERE id=s.id;
 UPDATE public.client_signing_packets SET completed_at=now() WHERE id=p.id AND completed_at IS NULL AND NOT EXISTS(SELECT 1 FROM public.client_document_signers WHERE packet_id=p.id AND signed_at IS NULL);
 RETURN 'signed';
END $$;
REVOKE ALL ON FUNCTION public.accept_document_signature(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.accept_document_signature(uuid,text,text,text) TO service_role;