# Reformulação da área de Conteúdos

## Objetivo
Transformar a tela Conteúdo do painel em um fluxo que começa pelo upload do artigo completo e preenche o resto automaticamente, exibir todos os campos na página pública e conectar os conteúdos publicados à Newsletter e ao Boletim Semanal.

## 1. Banco de dados
Novas colunas em `content_articles`:
- `article_date` (data do artigo, preenchida com a data do upload, editável)
- `chart_data` (texto opcional: dados do gráfico)
- `table_data` (texto opcional: tabela em markdown)

Novas colunas em `article_submissions` para o formulário público completo: `cpf`, `phone`, `role_label` (identificação como autor), `institution`, `service`, `group_id`.

## 2. Tela Conteúdo (painel) — nova ordem de campos
1. **Artigo completo para download** (primeiro campo). Ao subir o PDF/DOC:
   - o texto é extraído no navegador e enviado à IA, que preenche título, resumo, texto do artigo (resumo do arquivo), categoria, serviço relacionado, tabela e gráfico quando existirem;
   - a **data do artigo** recebe a data do upload;
   - a **ordem** recebe o próximo número da sequência;
   - todos os campos continuam editáveis.
2. **Autores**: seleção múltipla de usuários cadastrados (igual à Newsletter); o campo passa a se chamar **E-mail dos autores**, preenchido automaticamente e editável.
3. **Tipo**: padrão Artigo. Para o tipo **Vídeo**, o link (YouTube/Vimeo/MP4) passa a ser incorporado como player na página pública — hoje só abre link externo.
4. **Link externo**: sem a palavra "opcional", gerado automaticamente a partir do slug (`/content/<slug>`), como na Newsletter.
5. **Imagem de capa**: botão "Gerar imagem" com o mesmo gerador usado na Newsletter, mantendo o upload manual.
6. **Gráfico** e **Tabela** (opcionais), exibidos dentro do texto na página pública.
7. **Data do artigo** editável.

## 3. Página pública do conteúdo
Exibe todos os campos preenchidos: capa, tipo, título, autores, e-mail dos autores, data, resumo, texto, tabela, gráfico, vídeo (quando o tipo for Vídeo), download do arquivo, leituras, avaliação e compartilhamento. Campos vazios não aparecem.

## 4. Envio de artigos pelo público
Nova página **Envie seu artigo** (`/content/enviar`), com formulário completo: nome, identificação como autor, e-mail, telefone, CPF, instituição, título, resumo, categoria/serviço, mensagem e upload do arquivo. O bloco atual da página do artigo passa a apontar para essa página.

## 5. Painel — novas listas
- **Artigos enviados pelo público** (mantido).
- **Histórico de Conteúdos Publicados** (abaixo): nome, autores, link, categoria, arquivo para download e data, ordenado por data.

## 6. Integrações
- **Nova newsletter**: seletor "Usar conteúdo publicado" que preenche assunto, texto, autores, e-mails, imagem e link a partir do artigo escolhido.
- **Boletim Semanal**: bloco final "Leia o último artigo publicado pela Liberato Consulting:" com título e link do artigo mais recente, em todos os idiomas do boletim.

## 7. Primeiro artigo carregado
Cadastro do PDF "Metas que saem do papel: como desdobrar estratégia até a rotina" (Artigo, autor Felipe Liberato de Souza, categoria Estratégia, ordem 1, data 15/08/2026), com resumo e texto extraídos do arquivo e imagem de capa gerada sobre o tema de desdobramento de metas.

## Notas técnicas
- Extração de texto do PDF no navegador com `pdfjs-dist`; a geração dos campos usa a IA já configurada (`ai.server.ts`), com tradução automática ao salvar, como hoje.
- Gráfico renderizado a partir de pares "rótulo: valor"; tabela em markdown simples.
