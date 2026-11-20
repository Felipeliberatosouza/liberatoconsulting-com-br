import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { CompanyFields } from "@/components/fechou/CompanyFields";
import { emptyCompanyBrand, companyBrandCopy, companyBrandSchema } from "@/lib/fechou-brand";
import { useLanguage } from "@/i18n";
import { Palette } from "lucide-react";
import { Board } from "@/components/fechou/Board";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import {
  demoDeals,
  demoMember,
  demoStages,
  demoWorkspace,
  type DealInput,
  type Goal,
} from "@/lib/fechou";

export const Route = createFileRoute("/demo/crm")({
  head: () => ({
    meta: [
      { title: "Demonstração interativa — Fechou! CRM" },
      {
        name: "description",
        content:
          "Experimente o funil comercial, alertas, metas e relatórios do Fechou! CRM com dados fictícios.",
      },
      { property: "og:title", content: "Demonstração interativa — Fechou! CRM" },
      {
        property: "og:description",
        content:
          "Experimente o CRM com dados fictícios e personalize a demonstração com sua marca.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Demo,
});
function Demo() {
  const { lang } = useLanguage(); const copy = companyBrandCopy[lang];
  const [stages, setStages] = useState(demoStages);
  const [deals, setDeals] = useState(() => demoDeals(0));
  const [goals, setGoals] = useState<Goal[]>([]);
  const [custom, setCustom] = useState(true);
  const [error, setError] = useState("");
  const [brand, setBrand] = useState({ ...emptyCompanyBrand });
  useEffect(() => {
    setDeals(demoDeals());
    setGoals([
      {
        workspace_id: demoWorkspace,
        owner_id: demoMember.user_id,
        period: `${new Date().toISOString().slice(0, 7)}-01`,
        amount: 40000,
      },
    ]);
  }, []);
  const makeDeal = (input: DealInput) => ({
    ...input,
    id: crypto.randomUUID(),
    workspace_id: demoWorkspace,
    created_at: new Date().toISOString(),
    entered_at: new Date().toISOString(),
  });
  return (
    <div style={brand.color ? { "--fechou-coral": brand.color } as CSSProperties : undefined}>
      <Board
        name={brand.name || "Empresa Exemplo"}
        branding={
          brand.logo && (
            <img
              src={brand.logo}
              alt={`Logomarca de ${brand.name}`}
              className="mb-3 h-10 max-w-40 object-contain object-left"
            />
          )
        }
        user={{ ...demoMember, name: brand.contact || demoMember.name }}
        stages={stages}
        deals={deals}
        goals={goals}
        members={[demoMember]}
        demo
        header={
          <>
            <Button variant="outline" onClick={() => setCustom(true)}>
              <Palette /> Usar minha marca
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/crm">Sobre o CRM</Link>
            </Button>
          </>
        }
        save={async (input, id) => {
          if (id)
            setDeals((all) =>
              all.map((d) =>
                d.id === id
                  ? {
                      ...d,
                      ...input,
                      entered_at:
                        d.stage_id === input.stage_id ? d.entered_at : new Date().toISOString(),
                    }
                  : d,
              ),
            );
          else setDeals((all) => [makeDeal(input), ...all]);
        }}
        saveStage={async (id, name, days) =>
          setStages((all) => all.map((s) => (s.id === id ? { ...s, name, target_days: days } : s)))
        }
        saveGoal={async (owner, month, amount) =>
          setGoals((all) => [
            ...all.filter((g) => g.owner_id !== owner || !g.period.startsWith(month)),
            { workspace_id: demoWorkspace, owner_id: owner, period: `${month}-01`, amount },
          ])
        }
        importRows={async (rows) =>
          setDeals((all) => {
            const next = [...all];
            for (const { id, ...data } of rows) {
              const old = next.findIndex((d) => d.id === id);
              const existing = next[old];
              if (existing)
                next[old] = {
                  ...existing,
                  ...data,
                  entered_at:
                    data.stage_id === existing.stage_id
                      ? existing.entered_at
                      : new Date().toISOString(),
                };
              else next.unshift(makeDeal(data));
            }
            return next;
          })
        }
      />
      <Dialog open={custom} onOpenChange={setCustom}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              const result = companyBrandSchema.safeParse(brand);
              if (!result.success) { setError(result.error.issues[0]?.message || copy.manual); return; }
              setBrand(result.data);
              setCustom(false);
            }}
          >
            <CompanyFields value={brand} onChange={setBrand} />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button>{copy.apply}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
