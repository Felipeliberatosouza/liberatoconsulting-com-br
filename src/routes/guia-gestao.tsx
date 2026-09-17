import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/guia-gestao")({
  head: () => ({ meta: [{ title: "Guia Gestão Completa para Crescer com Controle — Liberato Consulting" }, { name: "description", content: "Acesse o Guia Gestão Completa para Crescer com Controle na biblioteca de materiais da Liberato Consulting." }, { property: "og:title", content: "Guia Gestão Completa para Crescer com Controle" }, { property: "og:description", content: "Material prático para estruturar a gestão e crescer com controle." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: GuidePage,
});

function GuidePage() { return <section className="min-h-[65vh] bg-ink py-20 text-ink-foreground"><div className="mx-auto max-w-5xl px-6"><BookOpen className="size-10 text-accent"/><h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">Guia Gestão Completa para Crescer com Controle</h1><p className="mt-6 max-w-2xl text-lg text-ink-foreground/70">Acesse sua conta para consultar e baixar o guia quando ele estiver disponível na biblioteca.</p><Button asChild className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/ferramentas" search={{ modo: undefined }}>Acessar materiais <ArrowRight/></Link></Button></div></section>; }