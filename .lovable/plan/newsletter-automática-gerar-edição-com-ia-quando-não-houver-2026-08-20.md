# Newsletter automática: gerar edição com IA quando não houver rascunho

## Por que a Newsletter não saiu

Verificação feita no banco e nos registros do agendador:

- O agendador disparou normalmente hoje às 11h (Brasília) e o site respondeu com sucesso:
  `{"ok": true, "skipped": "Nenhuma campanha em rascunho."}`
- A tabela de campanhas da newsletter está **vazia** — não havia nenhuma edição em rascunho para enviar.
- Não foi falha de e-mail: remetente configurado e 2 inscritos ativos.
- O Boletim Semanal saiu porque ele monta o conteúdo sozinho a cada disparo; a Newsletter, hoje, só envia uma edição criada manualmente no painel.

## O que será construído

Quando chegar o horário agendado e não existir rascunho, a Newsletter passa a **gerar a edição automaticamente com IA** a partir dos conteúdos publicados desde o último envio, e então dispara. Sem conteúdo novo, o envio é pulado (sem erro).

Fluxo no horário agendado:

```text
1. Respeita a frequência (semanal / quinzenal / mensal)
2. Existe rascunho? -> envia esse rascunho (comportamento atual)
3. Não existe rascunho:
   a. Busca conteúdos publicados desde o último envio
   b. Nenhum conteúdo novo -> pula e registra o motivo
   c. Há conteúdo novo -> gera título, chamada e texto com IA,
      cria a campanha, envia e marca como enviada
```

Também no painel (Configurações > Envios automáticos):

- Uma opção para ligar/desligar a geração automática por IA da Newsletter (ligada por padrão).
- Indicação do último disparo automático e do motivo quando o envio foi pulado, para não ficar de novo em silêncio.

Os dias de envio permanecem como estão hoje (quinta-feira).

## Detalhes técnicos

- `src/routes/api/public/newsletter-weekly.ts`: após a checagem de frequência e ausência de rascunho, buscar `content_articles` publicados com `updated_at`/`article_date` posteriores ao último `sent_at`; se houver, chamar um novo gerador do servidor, criar a campanha e chamar `dispatchCampaign`.
- Novo `src/lib/newsletter-auto.server.ts`: monta o resumo dos artigos novos, chama `askJson` (`src/lib/ai.server.ts`) reutilizando o mesmo tom editorial de `generateNewsletterAI`, e insere a campanha em `newsletter_campaigns` com `status: 'draft'`. Erros de IA (402/403/429) interrompem o run e são gravados em `last_error`, sem repetir tentativas.
- `site_settings.newsletter_schedule` ganha o campo `autoGenerate` (boolean) e o endpoint grava `lastRun` com data e resultado.
- `src/lib/schedule.functions.ts` e `src/components/ScheduleSettings.tsx`: expor e salvar `autoGenerate` e exibir o último resultado.
