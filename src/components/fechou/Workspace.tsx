import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Board, FechouLogo, selectStyle } from "./Board";
import type { DealImport } from "@/lib/fechou";

function assert<T>(result: { data: T; error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export function Workspace() {
  const qc = useQueryClient();
  const [identity, setIdentity] = useState<string | null>();
  const [aal, setAal] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [factor, setFactor] = useState<{ id: string; qr?: string; secret?: string }>();
  const [selected, setSelected] = useState("");
  useEffect(() => {
    let active = true;
    let revision = 0;
    const refresh = async () => {
      const current = ++revision;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const strong = user
          ? (await supabase.auth.mfa.getAuthenticatorAssuranceLevel()).data?.currentLevel === "aal2"
          : false;
        if (active && current === revision) {
          setIdentity(user?.id ?? null);
          setAal(strong);
        }
      } catch {
        if (active && current === revision) {
          setIdentity(null);
          setAal(false);
        }
      }
    };
    void refresh();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        revision++;
        setIdentity(null);
        setAal(false);
        setFactor(undefined);
        qc.removeQueries({ queryKey: ["fechou"] });
      } else if (
        event === "SIGNED_IN" ||
        event === "MFA_CHALLENGE_VERIFIED" ||
        event === "TOKEN_REFRESHED"
      )
        setTimeout(() => {
          if (active) void refresh();
        }, 0);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [qc]);
  const companies = useQuery({
    queryKey: ["fechou", identity, "workspaces"],
    enabled: Boolean(identity && aal),
    queryFn: async () => assert(await supabase.from("fechou_workspaces").select().order("name")),
  });
  const workspace = companies.data?.find((x) => x.id === selected) ?? companies.data?.[0];
  const workspaceId = workspace?.id ?? "";
  const key = ["fechou", identity, "workspace", workspaceId];
  const rows = useQuery({
    queryKey: key,
    enabled: Boolean(identity && aal && workspaceId),
    queryFn: async () => {
      const [stages, members, goals] = await Promise.all([
        supabase.from("fechou_stages").select().eq("workspace_id", workspaceId).order("position"),
        supabase.from("fechou_members").select().eq("workspace_id", workspaceId).order("name"),
        supabase.from("fechou_goals").select().eq("workspace_id", workspaceId),
      ]);
      const deals = [];
      for (let start = 0; ; start += 500) {
        const page =
          assert(
            await supabase
              .from("fechou_deals")
              .select()
              .eq("workspace_id", workspaceId)
              .order("created_at", { ascending: false })
              .order("id")
              .range(start, start + 499),
          ) ?? [];
        deals.push(...page);
        if (page.length < 500) break;
      }
      return {
        stages: assert(stages) ?? [],
        members: assert(members) ?? [],
        goals: assert(goals) ?? [],
        deals,
      };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: key });
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
  }
  const member = rows.data?.members.find((m) => m.user_id === identity);
  return !workspace || !rows.data || !member || !aal ? (
    <main className="mx-auto grid min-h-[65vh] max-w-xl content-start gap-5 px-5 py-10 sm:py-16">
      <FechouLogo />
      {identity === undefined ? (
        <p>Carregando sua conta…</p>
      ) : !identity ? (
        <>
          <h1 className="text-3xl font-bold">Entre no Fechou! CRM</h1>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/ferramentas" search={{ modo: undefined }} hash="entrar">
                Entrar na minha conta
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/demo/crm">Abrir demonstração</Link>
            </Button>
          </div>
        </>
      ) : !aal ? (
        <>
          <h1 className="text-3xl font-bold">Verificação em duas etapas</h1>
          {factor ? (
            <form
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const code = String(new FormData(e.currentTarget).get("code"));
                void action(async () => {
                  assert(await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code }));
                  setAal(true);
                  setFactor(undefined);
                });
              }}
            >
              {factor.qr && (
                <>
                  <p className="text-sm">Escaneie o QR code com seu aplicativo autenticador.</p>
                  <img
                    src={factor.qr}
                    alt="QR code do autenticador"
                    className="size-44 rounded border border-border bg-card"
                  />
                  <code className="select-all break-all text-xs">{factor.secret}</code>
                </>
              )}
              <label className="grid gap-2 text-sm">
                Código de 6 dígitos
                <Input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                />
              </label>
              <Button disabled={busy}>Verificar código</Button>
            </form>
          ) : (
            <Button
              disabled={busy}
              onClick={() =>
                void action(async () => {
                  const list = assert(await supabase.auth.mfa.listFactors());
                  const saved = list?.totp[0];
                  if (saved) {
                    setFactor({ id: saved.id });
                    return;
                  }
                  for (const f of list?.all ?? []) {
                    if (f.factor_type === "totp" && f.status === "unverified")
                      assert(await supabase.auth.mfa.unenroll({ factorId: f.id }));
                  }
                  const next = assert(
                    await supabase.auth.mfa.enroll({
                      factorType: "totp",
                      friendlyName: "Fechou CRM",
                    }),
                  );
                  if (!next) throw new Error("Não foi possível iniciar a verificação.");
                  setFactor({ id: next.id, qr: next.totp.qr_code, secret: next.totp.secret });
                })
              }
            >
              Continuar com autenticador
            </Button>
          )}
        </>
      ) : companies.isError || rows.isError ? (
        <p role="alert">{companies.error?.message ?? rows.error?.message}</p>
      ) : companies.isPending || workspace ? (
        <p>Carregando sua empresa…</p>
      ) : (
        <>
          <h1 className="text-3xl font-bold">Crie seu espaço de vendas</h1>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const name = String(new FormData(e.currentTarget).get("name"));
              void action(async () => {
                const id = assert(await supabase.rpc("fechou_create_workspace", { p_name: name }));
                if (id) setSelected(id);
                await qc.invalidateQueries({ queryKey: ["fechou", identity, "workspaces"] });
              });
            }}
          >
            <label className="grid gap-2 text-sm">
              Nome da empresa
              <Input name="name" maxLength={120} required />
            </label>
            <Button disabled={busy}>Criar espaço</Button>
          </form>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {identity && (
        <Button
          variant="ghost"
          onClick={() =>
            void action(async () => {
              await qc.cancelQueries({ queryKey: ["fechou"] });
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
            })
          }
        >
          Sair
        </Button>
      )}
    </main>
  ) : (
    <Board
      key={workspace.id}
      name={workspace.name}
      user={member}
      {...rows.data}
      header={
        <>
          {(companies.data?.length ?? 0) > 1 && (
            <select
              aria-label="Empresa"
              className={`${selectStyle} w-auto`}
              value={workspace.id}
              onChange={(e) => setSelected(e.target.value)}
            >
              {companies.data?.map((w) => (
                <option value={w.id} key={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
          <Button variant="ghost" asChild>
            <Link to="/">Liberato Consulting</Link>
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              void action(async () => {
                await qc.cancelQueries({ queryKey: ["fechou"] });
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
              })
            }
          >
            Sair
          </Button>
          {error && <span role="alert">{error}</span>}
        </>
      }
      save={async (input, id) => {
        if (id) {
          const result = assert(
            await supabase
              .from("fechou_deals")
              .update(input)
              .eq("workspace_id", workspace.id)
              .eq("id", id)
              .select("id")
              .single(),
          );
          if (!result) throw new Error("Oportunidade não encontrada.");
        } else
          assert(
            await supabase.from("fechou_deals").insert({ ...input, workspace_id: workspace.id }),
          );
        await refresh();
      }}
      saveStage={async (id, name, days) => {
        assert(
          await supabase
            .from("fechou_stages")
            .update({ name, target_days: days })
            .eq("workspace_id", workspace.id)
            .eq("id", id)
            .select("id")
            .single(),
        );
        await refresh();
      }}
      saveGoal={async (owner, month, amount) => {
        assert(
          await supabase
            .from("fechou_goals")
            .upsert({ workspace_id: workspace.id, owner_id: owner, period: `${month}-01`, amount }),
        );
        await refresh();
      }}
      addMember={
        member.role === "admin"
          ? async (email, name, role) => {
              assert(
                await supabase.rpc("fechou_add_member", {
                  p_workspace: workspace.id,
                  p_email: email,
                  p_name: name,
                  p_role: role,
                }),
              );
              await refresh();
            }
          : undefined
      }
      updateMember={
        member.role === "admin"
          ? async (id, role, active) => {
              assert(
                await supabase.rpc("fechou_update_member", {
                  p_workspace: workspace.id,
                  p_member: id,
                  p_role: role,
                  p_active: active,
                }),
              );
              await refresh();
            }
          : undefined
      }
      importRows={async (list: DealImport[]) => {
        assert(
          await supabase.rpc("fechou_import_deals", { p_workspace: workspace.id, p_rows: list }),
        );
        await refresh();
      }}
    />
  );
}
