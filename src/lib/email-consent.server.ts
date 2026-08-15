import { getEmailUnsubscribe, setEmailUnsubscribe } from "@lovable.dev/email-js";

const SENDER_DOMAIN = "notify.liberatoconsulting.com.br";

function apiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Serviço de e-mail indisponível.");
  return key;
}

export async function setRecipientEmailConsent(recipient: string, subscribed: boolean) {
  return setEmailUnsubscribe(
    { recipient: recipient.trim().toLowerCase(), domain: SENDER_DOMAIN, subscribed },
    { apiKey: apiKey() },
  );
}

export async function getRecipientEmailConsent(recipient: string) {
  return getEmailUnsubscribe(
    { recipient: recipient.trim().toLowerCase(), domain: SENDER_DOMAIN },
    { apiKey: apiKey() },
  );
}

export function consentErrorMessage(error: unknown) {
  if (error != null && typeof error === "object" && "code" in error) {
    const code = String(error.code ?? "");
    if (code === "complaint_not_liftable") {
      return "Este endereço registrou uma reclamação de spam e não pode ser reativado.";
    }
  }
  return "Não foi possível atualizar a autorização de recebimento.";
}