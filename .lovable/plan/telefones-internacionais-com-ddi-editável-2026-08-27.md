# Telefones internacionais com DDI editável

## Objetivo
Padronizar todos os campos de telefone e WhatsApp para sugerir `+55`, sem bloquear a troca do DDI, com máscara progressiva, validação internacional e regra brasileira correta: `+55 (11) 99999-9999`.

## Implementação
- Refatorar a função compartilhada de máscara/validação para:
  - preservar e permitir editar o `+DDI`;
  - iniciar campos novos com sugestão `+55` ao receber foco/digitação;
  - formatar números brasileiros com DDD + 9 dígitos;
  - aceitar números internacionais com DDI e comprimento válido, sem impor o formato brasileiro;
  - fornecer mensagem e placeholder compartilhados.
- Aplicar o comportamento em todos os formulários públicos e administrativos de telefone/WhatsApp, mantendo `type="tel"`, teclado numérico, autocomplete e componentes estáveis para não perder foco.
- Atualizar todos os schemas Zod e mensagens do servidor que ainda exigem o formato brasileiro antigo.
- Criar migração para substituir as restrições antigas de `leads` e `job_applications` por validação coerente com números internacionais e a regra específica de `+55`.
- Atualizar exemplos estáticos do formato antigo.

## Validação
- Testar a máscara progressiva brasileira, troca para outro DDI, edição/backspace e bloqueio de telefone incompleto.
- Simular os formulários em viewport desktop e mobile, incluindo “Dados da consultoria”, confirmando foco estável e mensagens claras.
- Publicar a versão validada no domínio oficial.

## Detalhes técnicos
- A validação será centralizada para evitar divergência entre formulários.
- Para `+55`: exatamente 2 dígitos de DDD válidos e 9 dígitos de celular, iniciando em 9.
- Para outros DDIs: padrão internacional com 8 a 15 dígitos totais, incluindo DDI de 1 a 3 dígitos.
