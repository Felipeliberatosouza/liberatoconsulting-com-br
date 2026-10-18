export type DeliveryEntry = {
  source: string;
  reference_id?: string | null;
  subject: string;
  recipient_name?: string;
  recipient_email?: string;
  recipient_phone?: string;
  channel: "email" | "whatsapp";
  status: "enviado" | "falhou";
  error?: string;
  is_test?: boolean;
  language?: string;
};

/** Grava os envios individuais no Painel de Envios. Nunca interrompe o disparo. */
export async function logDeliveries(entries: DeliveryEntry[]) {
  if (entries.length === 0) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("delivery_log").insert(
      entries.map((e) => ({ ...e, error: (e.error ?? "").slice(0, 500) })),
    );
  } catch (err) {
    console.error("[delivery-log] falha ao registrar envios", err);
  }
}
