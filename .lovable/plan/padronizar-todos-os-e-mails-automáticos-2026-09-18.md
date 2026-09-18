# Padronizar todos os e-mails automáticos

## Objetivo
Fazer a pré-visualização da área administrativa representar fielmente o e-mail recebido e aplicar o mesmo padrão Liberato Consulting a todos os e-mails automáticos.

## Alterações
1. Criar uma moldura visual compartilhada para os envios: fundo, largura, posição e tamanho da logomarca, tipografia, espaçamentos, título, texto, botões e rodapé institucional.
2. Fazer a pré-visualização administrativa usar essa mesma especificação visual, eliminando diferenças entre o painel e o e-mail real.
3. Corrigir o e-mail de boas-vindas da biblioteca gratuita:
   - remover do texto editável o endereço extenso de download;
   - manter somente um botão por material;
   - garantir que cada botão use o link temporário correto e clicável;
   - ajustar singular/plural quando houver vários materiais.
4. Aplicar a mesma moldura aos demais e-mails automáticos, inclusive confirmação de conta, recuperação de senha, acesso, alteração de e-mail, convites, aniversários, contatos e candidaturas.
5. Preservar a regra atual: o conteúdo é configurado uma vez em português e traduzido automaticamente quando o destinatário usa outro idioma.
6. Validar a aparência em pré-visualização, os links dos botões e os tipos do projeto.

## Detalhes técnicos
- Centralizar estilos e elementos de marca em componentes de e-mail reutilizáveis.
- Sanitizar o corpo do e-mail de materiais para não renderizar `{{link}}` nem URLs temporárias como texto corrido; o endereço ficará apenas no atributo do botão.
- Manter links temporários de download, pois anexos não são suportados pelo envio atual.
- Não alterar textos configurados pelo administrador além da remoção visual do endereço de download no corpo enviado.
