# Reorganização do Painel Administrativo

O pedido cobre 6 frentes grandes. Proponho construir em 3 entregas, cada uma funcional por si só.

## Entrega 1 — Usuários, perfis e permissões (base de tudo)

**Tipos de usuário**
- Sem senha (apenas cadastro): assinante de Newsletter, Candidato (Trabalhe Conosco), Lead (com o formulário que preencheu).
- Com acesso ao painel: Administrador, Autor de artigos, Consultor.

**Nova área "Usuários"** com 4 abas: Newsletter, Candidatos, Leads, Equipe (admin/autor/consultor).
- Newsletter/Leads/Candidatos: nome, e-mail e as informações que a própria pessoa enviou; permitir excluir, editar e ligar/desligar autorização de envio de e-mails.
- Equipe: criar cadastro com nome completo, data de nascimento, CPF, dados bancários/PIX, endereço, e-mail, telefone e demais dados necessários para gerar o contrato de vínculo. Editar, desativar e excluir.

**Permissões**
- Administrador: painel completo.
- Consultor: apenas Conteúdo e Dados do Brasil.
- Autor de artigos: apenas Newsletter (inserção de textos).
- Toda alteração de consultor/autor entra como **pedido de aprovação**: fica pendente, o administrador vê uma fila "Aprovações" e aprova ou recusa; só ao aprovar o conteúdo vai ao ar.

## Entrega 2 — Dados da consultoria, Configurações e Contratos

- **Dados da consultoria** (só admin): razão social, nome fantasia, CNPJ, endereço, logomarca, sócios (nome, CPF, cota) e demais dados.
- **Contratos**: modelos de contrato para Autor e para Consultor. Ao primeiro acesso, esses usuários veem o contrato e assinam digitalmente (aceite registrado com nome, CPF, data/hora e IP) antes de usar o sistema.
- **Configurações** (só admin): reúne num só lugar cores, logomarca, textos, títulos, carrossel — o que hoje está espalhado — mais o padrão de e-mails automáticos enviados aos usuários (boas-vindas, novo conteúdo, aprovação, etc.).

## Entrega 3 — Inteligência artificial (Dados do Brasil e Newsletter)

**Dados do Brasil**
- Nova seção "Indicadores econômicos" (PIB, inflação, Selic, câmbio, desemprego, investimento estrangeiro, balança comercial, risco país) exibida no site.
- Ferramenta de IA que busca e atualiza os indicadores nas fontes oficiais (IBGE, Banco Central, MDIC), com data e fonte de cada número; atualização manual por botão e agendada.
- Ferramenta de IA que reescreve os subitens (Panorama Econômico, Setores Estratégicos, etc.) em padrão acadêmico, com lista de fontes e data de atualização.
- Campo de autores por bloco (nome e contato).

**Newsletter**
- A partir do título, a IA gera: chamada curta, imagem de cabeçalho, texto de até 500 palavras e o material completo (até 5.000 palavras, com tabelas e dados).
- Data de atualização e autores em cada edição.
- Geração do PDF para download com marca d'água da logomarca atual, cabeçalho "Liberato Consulting" à esquerda e rodapé com nome e contatos da consultoria.

## Notas técnicas

- Banco: novas tabelas `profiles` (dados cadastrais completos), `user_roles` estendida com os papéis `autor` e `consultor`, `change_requests` (fila de aprovação), `company_profile`, `contracts` + `contract_signatures`, `economic_indicators`, `email_templates`; campos de autores/fontes/atualização nos blocos de Brasil e nas campanhas.
- Todas com RLS por papel e GRANTs; verificação de papel sempre no servidor (server functions), nunca no cliente.
- IA via Lovable AI Gateway (já usado nas traduções); busca de indicadores com modelo com acesso a fontes públicas + fallback manual.
- PDF gerado no servidor com biblioteca compatível com o runtime edge.
- Navegação do painel passa a ser montada conforme o papel do usuário logado.
