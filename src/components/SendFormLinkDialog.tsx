import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Mail, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listLinkRecipients, sendFormLink } from "@/lib/satisfaction.functions";
import { SCOPE_LINK, surveyLink } from "@/lib/satisfaction";

type FormKind = "escopo" | "executado" | "nao_executado";
const TITLES: Record<FormKind, string> = {
  escopo: "Escopo Inicial",
  executado: "Pesquisa — Serviço executado",
  nao_executado: "Pesquisa — Serviço não executado",
};

/** Link copiável + botão para enviar o link por e-mail aos contatos do CRM. */
export function FormLinkBar({ form }: { form: FormKind }) {
  const link = form === "escopo" ? SCOPE_LINK : surveyLink(form);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-border bg-background p-4 text-sm">
      <span className="font-medium">{TITLES[form]}:</span>
      <code className="rounded bg-secondary px-2 py-1 text-xs">{link}</code>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-accent hover:underline"
        onClick={() => {
          void navigator.clipboard.writeText(link);
          toast.success("Link copiado.");
        }}
      >
        <Copy className="size-4" /> Copiar
      </button>
      <SendFormLinkDialog form={form} />
    </div>
  );
}

export function SendFormLinkDialog({ form }: { form: FormKind }) {
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [extra, setExtra] = useState("");
  const recipients = useQuery({ queryKey: ["link-recipients"], queryFn: () => listLinkRecipients(), enabled: open });
  const company = recipients.data?.find((c) => c.id === companyId);
  const contacts = company?.contacts ?? [];

  const send = useMutation({
    mutationFn: () => {
      const list = contacts.filter((c) => picked.has(c.email)).map((c) => ({ name: c.name, email: c.email }));
      for (const e of extra.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean)) list.push({ name: "", email: e });
      return sendFormLink({ data: { form, company: company?.name ?? "", recipients: list } });
    },
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`E-mail enviado para ${res.sent} contato(s)${res.failed ? ` · ${res.failed} falha(s)` : ""}.`);
      if (res.sent) setOpen(false);
    },
    onError: () => toast.error("Verifique os e-mails informados e tente novamente."),
  });

  const total = picked.size + extra.split(/[,;\s]+/).filter((s) => s.includes("@")).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="gap-1">
          <Mail className="size-4" /> Enviar por e-mail
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar link — {TITLES[form]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <Label htmlFor="crm-company">Cliente do CRM</Label>
            <select
              id="crm-company"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                setPicked(new Set());
              }}
            >
              <option value="">{recipients.isLoading ? "Carregando…" : "Selecione o cliente"}</option>
              {(recipients.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.contacts.length})
                </option>
              ))}
            </select>
          </div>
          {company ? (
            contacts.length === 0 ? (
              <p className="text-muted-foreground">Este cliente não tem contatos com e-mail.</p>
            ) : (
              <div className="rounded-lg border border-border p-3">
                <label className="flex items-center gap-2 border-b border-border pb-2 font-medium">
                  <Checkbox
                    checked={picked.size === contacts.length}
                    onCheckedChange={(v) => setPicked(v ? new Set(contacts.map((c) => c.email)) : new Set())}
                  />
                  Todos os contatos ({contacts.length})
                </label>
                <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                  {contacts.map((c) => (
                    <label key={c.email} className="flex items-start gap-2">
                      <Checkbox
                        checked={picked.has(c.email)}
                        onCheckedChange={(v) => {
                          const next = new Set(picked);
                          if (v) next.add(c.email);
                          else next.delete(c.email);
                          setPicked(next);
                        }}
                      />
                      <span>
                        {c.name} <span className="text-muted-foreground">· {c.email}{c.role ? ` · ${c.role}` : ""}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )
          ) : null}
          <div>
            <Label htmlFor="extra-emails">Outros e-mails (opcional, separados por vírgula)</Label>
            <Input id="extra-emails" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="nome@empresa.com.br" />
          </div>
          <p className="text-xs text-muted-foreground">
            O texto segue o modelo editável em Configurações → E-mails automáticos.
          </p>
          <Button className="w-full gap-1" disabled={total === 0 || send.isPending} onClick={() => send.mutate()}>
            <Send className="size-4" /> {send.isPending ? "Enviando…" : `Enviar para ${total} destinatário(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
