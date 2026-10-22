import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { regenerateProspectKit } from "@/lib/prospect-kit-build";
import { getProspectKit } from "@/lib/prospect-kit.functions";

/** Resumo de serviços (3 slides) + banner do e-mail de prospecção: visualizar, atualizar e baixar. */
export function ProspectKitCard({ compact = false }: { compact?: boolean }) {
  const qc = useQueryClient();
  const kit = useQuery({ queryKey: ["prospect-kit"], queryFn: () => getProspectKit(), retry: false });
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    try {
      await regenerateProspectKit();
      await qc.invalidateQueries({ queryKey: ["prospect-kit"] });
      toast.success("Material atualizado com os dados atuais do painel.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar o material");
    } finally {
      setBusy(false);
    }
  };

  const urls = kit.data?.urls;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">Resumo de serviços para prospecção (3 slides)</h3>
          <p className="text-sm text-muted-foreground">
            Usa logomarca, números, serviços, consultores e dados da consultoria cadastrados no painel. Vai anexo nos e-mails de prospecção.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {kit.data?.updatedAt ? `Atualizado em ${new Date(kit.data.updatedAt).toLocaleString("pt-BR")}` : "Ainda não gerado."}
          </p>
        </div>
        <Button variant="outline" onClick={() => void refresh()} disabled={busy}>
          <RefreshCw className={`mr-1 size-4 ${busy ? "animate-spin" : ""}`} /> {busy ? "Gerando…" : "Gerar / atualizar"}
        </Button>
      </div>
      {urls ? (
        <div className="mt-4 space-y-3">
          {!compact && urls.bannerView ? (
            <img src={urls.bannerView} alt="Banner do e-mail de prospecção" className="w-full max-w-xl rounded-lg border border-border" />
          ) : null}
          <div className="flex flex-wrap gap-2">
            <a href={urls.pdf} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-accent"><Download className="size-3" /> PDF</a>
            <a href={urls.pptx} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-accent"><Download className="size-3" /> PowerPoint</a>
            <a href={urls.banner} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-accent"><Download className="size-3" /> Banner (PNG)</a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
