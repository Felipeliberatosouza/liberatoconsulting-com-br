# Projetos — atendimento a solicitações de clientes

Nova área "Projetos" no painel, organizada como um processo visual de 4 etapas, com as etapas 1 e 2 criadas do zero e as etapas 3 e 4 reaproveitando o que já existe.

## Visão da área

`/admin/projetos` mostra uma trilha horizontal numerada (1 → 2 → 3 → 4), cada etapa como cartão clicável com título, descrição curta, contagem de itens (ex.: escopos recebidos) e subitens listados. Fora da trilha, um link separado abaixo: **Orçamentos emitidos**.

```text
┌──1──────────┐ ┌──2──────────┐ ┌──3──────────┐ ┌──4──────────┐
│ Escopo      │→│ Diagnóstico │→│ Organização │→│ Orçamento   │
│ Inicial     │ │ Detalhado   │ │ e Precific. │ │             │
│ · Formulário│ │ · 6 abas    │ │ · Homem-hora│ │ · Gerar     │
│ · Recebidos │ │             │ │ · Etapas    │ │   orçamento │
│ · Guia      │ │             │ │   por serv. │ │             │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
              ↳ link separado: Orçamentos emitidos
```

"Precificação e orçamentos" sai do menu principal do painel e passa a viver dentro de Projetos (etapas 3 e 4), com as mesmas telas já existentes (Valor do homem-hora, Etapas por serviço, Gerar orçamento, Orçamentos emitidos).

## Etapa 1 — Escopo Inicial de Necessidade do Cliente

**Página pública `/escopoinicial`** (sem login, link para enviar a clientes):
- Cabeçalho com a logomarca da Liberato Consulting vinda da área administrativa.
- Identificação: empresa, nome do respondente, cargo, e-mail, celular.
- As 10 perguntas da planilha, cada uma com suas alternativas (uma opção por pergunta) e um campo livre **Comentários**:
  1. Objetivo · 2. Resultado esperado · 3. Empresa e oferta · 4. Cliente-alvo · 5. Abrangência · 6. Pesquisa com o mercado · 7. Dimensionamento · 8. Entregáveis · 9. Prazo · 10. Investimento.
- Acima do rodapé, faixa com boa visibilidade "Receba ferramentas gratuitas de gestão" com quatro ícones-link: Guia de Gestão Completa, Newsletter, Artigos, Boletim Semanal.
- Rodapé em linhas sequenciais: nome fantasia em negrito, CNPJ, endereço, celular, site, e-mail — todos lidos de Dados da consultoria.
- Ao enviar: grava a resposta e mostra confirmação.

**Subitem `Escopos recebidos de clientes`** no painel: lista com empresa, nome e cargo do respondente, e-mail, celular, data e hora; campo de busca por empresa ou nome do respondente; ao abrir um registro, todas as respostas e comentários.

**Subitem `Guia do consultor`**: dentro do escopo aberto, painel de leitura rápida que aplica a tabela "Sinal observado → O que indica → Ação sugerida" da planilha às respostas daquele cliente (destaca automaticamente os sinais acionados), mais o checklist de 7 itens antes da proposta e a orientação de quando migrar para o diagnóstico completo.

## Etapa 2 — Diagnóstico Detalhado

Página com 6 subitens (abas), espelhando o arquivo:
1. **Leia-me** — como usar, legenda e princípios (texto fixo).
2. **Diagnóstico** — seletor do serviço da consultoria no topo; o formulário se redesenha conforme o serviço escolhido. Cada pergunta tem: bloco, texto, formato sugerido, resposta do cliente, obrigatório, impacto no escopo e observações do consultor.
3. **Score de esforço** — 10 dimensões com nota 1–5, peso, pontos ponderados, evidência e média ponderada com faixa indicativa.
4. **Escopo e esforço** — módulos com Incluir?, quantidade, dias unitários, % Senior/Analista/PM, dias por perfil, custo direto, entregável e dependência; totais por perfil.
5. **Orçamento** — taxas diárias por perfil, contingência, impostos, desconto; cálculo do preço, faixa de negociação (0,85 / 1,00 / 1,15) e marcos de pagamento.
6. **Resumo** — checklist de prontidão: respondidas, obrigatórias pendentes, média de esforço, dias por perfil e preço indicativo.

**Formulário por serviço:** cada serviço cadastrado em Cadastro de serviços ganha seu próprio conjunto de perguntas. A base comum (Objetivo e decisão, Empresa e oferta, Governança e dados, Entregáveis, Contratação e orçamento) vem do modelo anexado; os blocos técnicos variam por serviço, com perguntas construídas a partir de práticas de consultoria e literatura de gestão para cada família — por exemplo:
- Pesquisa de mercado: mercado e geografia, dimensionamento TAM/SAM/SOM, concorrência, pesquisa primária.
- Estratégia: diagnóstico competitivo, metas e desdobramento, portfólio, indicadores.
- Operações/processos: mapeamento de processos, gargalos, volumes, qualidade, custos, sistemas.
- Vendas e marketing: funil, canais, precificação, CRM, equipe.
- Financeiro: estrutura de custos, margem, capital de giro, orçamento, controles.
- Pessoas e gestão: estrutura, papéis, rotinas de gestão, cultura, rituais.
- IA aplicada: dados disponíveis, casos de uso, integrações, governança.

O conjunto fica salvo por serviço e editável no painel, para ajuste fino sem mexer no código.

## Detalhes técnicos

- Migration: `project_scope_submissions` (identificação, respostas e comentários em jsonb, criado em) — inserção pública via função de servidor validada, leitura só para painel; `project_diagnostics` (serviço, cliente, respostas, scores, módulos, premissas de orçamento em jsonb) restrita ao painel; `project_diagnostic_templates` (serviço → blocos e perguntas) com leitura no painel. GRANTs e RLS em todas.
- Rota pública `src/routes/escopoinicial.tsx` com `head()` próprio (noindex) e formulário validado com zod; envio por `createServerFn` público com limite de tamanho e sanitização.
- Perguntas e alternativas da etapa 1 em `src/lib/scope-form.ts`; regras do Guia do consultor em `src/lib/scope-guide.ts` (sinais → ação), aplicadas às respostas salvas.
- Novas rotas de painel: `admin.projetos.tsx` (trilha), `admin.projetos.escopos.tsx`, `admin.projetos.diagnostico.tsx`; etapas 3 e 4 apontam para as abas já existentes de `admin.precificacao.tsx`.
- Catálogo de diagnóstico por serviço em `src/lib/diagnostic-catalog.ts`, com blocos base + blocos por família de serviço, resolvidos pelo `family_id`/`group_id` do serviço.
- `AdminShell`: item "Projetos" substitui "Precificação e orçamentos" no menu; `roles.ts` mantém as novas rotas restritas a admin.
- Rodapé e logomarca da página pública reutilizam `getPublicCompanyIdentity` e o logo do painel.
