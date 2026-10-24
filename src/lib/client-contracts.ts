/**
 * Modelos de NDA e Contrato de Prestação de Serviços de Consultoria (direito brasileiro).
 * Funções puras: recebem os dados das partes e devolvem o texto em seções.
 */

export type Party = {
  legal_name: string;
  cnpj: string;
  address: string;
  representative: string;
  representative_cpf: string;
  representative_role: string;
  email: string;
};

export type QuoteAnnex = {
  service_title: string;
  total: string;
  start_date: string | null;
  end_date: string | null;
  issued_at: string;
  file_name: string;
};

export type ContractInput = {
  consultant: Party;
  client: Party;
  city: string;
  date: string;
  quote?: QuoteAnnex | null;
  paymentTerms?: string;
  ndaDate?: string;
};

export type Section = { title: string; paragraphs: string[] };
export type LegalDoc = { title: string; preamble: string[]; sections: Section[]; closing: string[] };

const blank = (v: string, fallback = "____________________") => (v && v.trim() ? v.trim() : fallback);

function qualify(p: Party, role: string) {
  return `${blank(p.legal_name)}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${blank(p.cnpj)}, com sede em ${blank(p.address)}, neste ato representada por ${blank(p.representative)}, ${blank(p.representative_role, "representante legal")}, inscrito(a) no CPF sob o nº ${blank(p.representative_cpf)}, doravante denominada ${role}`;
}

/** NDA — assinado antes de qualquer troca de informações, do escopo e do orçamento. */
export function buildNda(i: ContractInput): LegalDoc {
  return {
    title: "TERMO DE CONFIDENCIALIDADE E NÃO DIVULGAÇÃO (NDA)",
    preamble: [
      `Pelo presente instrumento particular, de um lado ${qualify(i.client, "REVELADORA")}; e, de outro lado, ${qualify(i.consultant, "RECEPTORA")}; em conjunto denominadas PARTES,`,
      "considerando que as PARTES pretendem trocar informações para que a RECEPTORA elabore escopo, diagnóstico, plano de trabalho e proposta comercial de serviços de consultoria (\"Finalidade\"), antes de qualquer contratação, celebram este Termo, que se regerá pelas cláusulas seguintes e pela legislação brasileira, em especial o Código Civil (Lei nº 10.406/2002), a Lei nº 9.279/1996 e a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).",
    ],
    sections: [
      { title: "CLÁUSULA 1ª – DO OBJETO", paragraphs: [
        "1.1. Este Termo tem por objeto proteger as Informações Confidenciais que a REVELADORA fornecer à RECEPTORA, por qualquer meio, para a Finalidade, desde a data de sua assinatura, independentemente da celebração de contrato posterior.",
      ] },
      { title: "CLÁUSULA 2ª – DAS INFORMAÇÕES CONFIDENCIAIS", paragraphs: [
        "2.1. Consideram-se Informações Confidenciais todos os dados e documentos, escritos, verbais, eletrônicos ou de qualquer natureza, relativos à REVELADORA, seus sócios, clientes, fornecedores e colaboradores, incluindo, sem limitação: informações financeiras, contábeis e fiscais, faturamento, custos, margens, preços, planos de negócio, estratégias, processos, know-how, segredos comerciais e industriais, bases de dados, dados pessoais, respostas a escopos e diagnósticos e quaisquer análises derivadas.",
        "2.2. Não são Informações Confidenciais as que, comprovadamente: (a) já forem de domínio público sem culpa da RECEPTORA; (b) já estivessem legitimamente em posse da RECEPTORA antes da revelação; (c) forem recebidas legitimamente de terceiros sem dever de sigilo; ou (d) tiverem de ser reveladas por ordem judicial ou de autoridade competente, hipótese em que a RECEPTORA avisará previamente a REVELADORA, quando permitido, e revelará apenas o estritamente exigido.",
      ] },
      { title: "CLÁUSULA 3ª – DAS OBRIGAÇÕES DA RECEPTORA", paragraphs: [
        "3.1. A RECEPTORA obriga-se a: (a) usar as Informações Confidenciais exclusivamente para a Finalidade; (b) não divulgá-las, publicá-las, copiá-las ou cedê-las a terceiros sem autorização prévia e escrita; (c) restringir o acesso aos sócios, consultores e colaboradores que delas necessitem para a Finalidade, os quais estarão vinculados a obrigações de sigilo equivalentes; (d) adotar medidas de segurança técnicas e administrativas no mínimo iguais às que adota para suas próprias informações sigilosas; e (e) comunicar imediatamente qualquer acesso ou uso não autorizado de que tome conhecimento.",
        "3.2. A RECEPTORA responde pelos atos de seus sócios, consultores e colaboradores que violarem este Termo.",
      ] },
      { title: "CLÁUSULA 4ª – DA PROTEÇÃO DE DADOS PESSOAIS", paragraphs: [
        "4.1. Havendo tratamento de dados pessoais, a RECEPTORA atuará como operadora, conforme as instruções da REVELADORA e a LGPD, tratando apenas os dados necessários à Finalidade e eliminando-os ao término dela.",
      ] },
      { title: "CLÁUSULA 5ª – DA PROPRIEDADE E DA DEVOLUÇÃO", paragraphs: [
        "5.1. As Informações Confidenciais permanecem de propriedade exclusiva da REVELADORA. Este Termo não concede licença nem direito de uso para outra finalidade.",
        "5.2. Mediante solicitação ou caso não haja contratação, a RECEPTORA devolverá ou destruirá, em até 10 (dez) dias, todas as Informações Confidenciais e cópias, declarando por escrito o cumprimento.",
      ] },
      { title: "CLÁUSULA 6ª – DO PRAZO", paragraphs: [
        "6.1. As obrigações deste Termo vigoram desde sua assinatura e permanecerão por 5 (cinco) anos após a última revelação de informação ou após o término de eventual contrato entre as PARTES, o que ocorrer por último. Segredos comerciais e industriais permanecem protegidos enquanto mantiverem essa condição.",
      ] },
      { title: "CLÁUSULA 7ª – DAS PENALIDADES", paragraphs: [
        "7.1. O descumprimento deste Termo sujeitará a parte infratora ao pagamento das perdas e danos comprovados, sem prejuízo das medidas judiciais cabíveis, inclusive tutela inibitória, e das responsabilidades civis e criminais previstas em lei, em especial no art. 195 da Lei nº 9.279/1996.",
      ] },
      { title: "CLÁUSULA 8ª – DISPOSIÇÕES GERAIS", paragraphs: [
        "8.1. Este Termo não obriga as PARTES a contratarem entre si.",
        "8.2. As PARTES reconhecem a validade da assinatura eletrônica deste instrumento, nos termos da MP nº 2.200-2/2001 e da Lei nº 14.063/2020.",
        `8.3. Fica eleito o foro da Comarca de ${blank(i.city)} para dirimir quaisquer questões oriundas deste Termo, com renúncia a qualquer outro, por mais privilegiado que seja.`,
      ] },
    ],
    closing: [`${blank(i.city)}, ${blank(i.date)}.`],
  };
}

/** Contrato de prestação de serviços de consultoria, com o orçamento aprovado como Anexo I. */
export function buildContract(i: ContractInput): LegalDoc {
  const q = i.quote;
  const period = q?.start_date || q?.end_date ? ` com início previsto em ${blank(q?.start_date ?? "")} e término previsto em ${blank(q?.end_date ?? "")}` : " conforme o cronograma do Anexo I";
  return {
    title: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CONSULTORIA EMPRESARIAL",
    preamble: [
      `Pelo presente instrumento particular, de um lado ${qualify(i.client, "CONTRATANTE")}; e, de outro lado, ${qualify(i.consultant, "CONTRATADA")}; em conjunto PARTES, têm entre si justo e contratado o presente Contrato, regido pelos arts. 593 a 609 e demais disposições aplicáveis do Código Civil e pela LGPD, mediante as cláusulas a seguir.`,
    ],
    sections: [
      { title: "CLÁUSULA 1ª – DO OBJETO", paragraphs: [
        `1.1. A CONTRATADA prestará à CONTRATANTE serviços de consultoria em ${blank(q?.service_title ?? "")}, nos termos, etapas, entregáveis e prazos descritos no orçamento aprovado pela CONTRATANTE, que integra este Contrato como ANEXO I.`,
        "1.2. Em caso de divergência, prevalece este Contrato sobre o Anexo I. Serviços não previstos no Anexo I dependerão de aditivo escrito.",
      ] },
      { title: "CLÁUSULA 2ª – DO PRAZO", paragraphs: [
        `2.1. Os serviços serão executados${period}. O prazo poderá ser prorrogado por aditivo ou em razão de atraso no fornecimento de informações pela CONTRATANTE.`,
      ] },
      { title: "CLÁUSULA 3ª – DO PREÇO E DO PAGAMENTO", paragraphs: [
        `3.1. Pelos serviços, a CONTRATANTE pagará o valor total de ${blank(q?.total ?? "")}, conforme Anexo I.`,
        `3.2. Forma de pagamento: ${blank(i.paymentTerms ?? "", "conforme condições do Anexo I")}.`,
        "3.3. O atraso no pagamento sujeitará a CONTRATANTE a multa de 2% (dois por cento), juros de mora de 1% (um por cento) ao mês pro rata die e correção monetária pelo IPCA, podendo a CONTRATADA suspender os serviços após 15 (quinze) dias de atraso, mediante aviso.",
        "3.4. Os tributos incidentes sobre os serviços são de responsabilidade de quem a lei determinar. Despesas de viagem, quando necessárias, serão previamente aprovadas e reembolsadas pela CONTRATANTE.",
      ] },
      { title: "CLÁUSULA 4ª – DAS OBRIGAÇÕES DA CONTRATADA", paragraphs: [
        "4.1. Executar os serviços com diligência, técnica e ética, alocando consultores qualificados.",
        "4.2. Entregar os produtos previstos no Anexo I e manter a CONTRATANTE informada sobre o andamento.",
        "4.3. A obrigação da CONTRATADA é de meio: recomendações e planos dependem da implementação e das decisões da CONTRATANTE, que permanece responsável por sua gestão.",
      ] },
      { title: "CLÁUSULA 5ª – DAS OBRIGAÇÕES DA CONTRATANTE", paragraphs: [
        "5.1. Fornecer, nos prazos combinados, informações, documentos e acesso a pessoas necessários aos serviços, responsabilizando-se por sua veracidade.",
        "5.2. Designar um responsável interno pelo projeto e efetuar os pagamentos nas datas pactuadas.",
      ] },
      { title: "CLÁUSULA 6ª – DA CONFIDENCIALIDADE", paragraphs: [
        `6.1. As PARTES ratificam integralmente o Termo de Confidencialidade e Não Divulgação (NDA) firmado em ${blank(i.ndaDate ?? "")}, antes de qualquer troca de informações, que permanece em vigor e passa a integrar este Contrato.`,
        "6.2. A CONTRATADA manterá sob sigilo absoluto todas as informações da CONTRATANTE recebidas antes ou durante este Contrato, incluindo dados financeiros, estratégicos, operacionais, comerciais, de clientes e colaboradores, bem como diagnósticos, relatórios e resultados dos serviços, usando-os exclusivamente para a execução do objeto.",
        "6.3. O acesso será restrito aos consultores alocados, todos vinculados a dever de sigilo equivalente, respondendo a CONTRATADA por eventuais violações por eles cometidas.",
        "6.4. A obrigação de sigilo subsiste por 5 (cinco) anos após o término deste Contrato, por qualquer motivo, e por prazo indeterminado quanto a segredos comerciais e industriais.",
        "6.5. As exceções ao sigilo são apenas as previstas no NDA. A violação sujeita a parte infratora a responder por perdas e danos, sem prejuízo da rescisão por justa causa.",
      ] },
      { title: "CLÁUSULA 7ª – DA PROTEÇÃO DE DADOS PESSOAIS", paragraphs: [
        "7.1. As PARTES cumprirão a LGPD. A CONTRATADA tratará dados pessoais apenas como operadora, segundo instruções da CONTRATANTE e para a finalidade do Contrato, adotando medidas de segurança adequadas, comunicando incidentes em até 48 (quarenta e oito) horas e eliminando os dados ao término dos serviços, salvo obrigação legal de guarda.",
      ] },
      { title: "CLÁUSULA 8ª – DA PROPRIEDADE INTELECTUAL", paragraphs: [
        "8.1. Os relatórios e entregáveis produzidos especificamente para a CONTRATANTE poderão ser por ela usados livremente em suas atividades internas após a quitação do preço.",
        "8.2. Metodologias, ferramentas, modelos, softwares e conhecimentos prévios ou genéricos da CONTRATADA permanecem de sua propriedade exclusiva, podendo ser reutilizados, desde que sem qualquer informação confidencial da CONTRATANTE.",
      ] },
      { title: "CLÁUSULA 9ª – DO USO DO NOME E DA MARCA DA CONTRATANTE COMO REFERÊNCIA", paragraphs: [
        "9.1. A CONTRATANTE autoriza a CONTRATADA, de forma gratuita e não exclusiva, a mencionar sua razão social, nome fantasia e marca (logotipo) exclusivamente para indicar que a CONTRATANTE é ou foi cliente da Liberato Consulting, em: (a) site e redes sociais institucionais da CONTRATADA; (b) apresentações comerciais e propostas; (c) materiais de credenciais e portfólio de clientes.",
        "9.2. Condições de uso: (a) a menção se limita ao fato da existência da relação comercial e, se a CONTRATANTE aprovar previamente por escrito, a uma descrição genérica do tipo de serviço prestado; (b) é vedada a divulgação de valores do contrato, dados financeiros, indicadores, resultados numéricos, diagnósticos, estratégias, nomes de colaboradores, clientes ou fornecedores da CONTRATANTE ou de qualquer informação confidencial protegida pela Cláusula 6ª e pelo NDA; (c) estudos de caso, depoimentos ou divulgação de resultados dependem de aprovação prévia e escrita do texto final pela CONTRATANTE; (d) a marca será reproduzida sem alteração de cores, proporções ou elementos gráficos, podendo apenas ser aplicada sobre fundo que garanta sua legibilidade; (e) a marca não será associada a conteúdo político, religioso, ofensivo, nem usada de modo a sugerir endosso de produtos ou de terceiros.",
        "9.3. A autorização vigora durante este Contrato e por até 5 (cinco) anos após seu término. A CONTRATANTE pode revogá-la a qualquer tempo, por escrito, hipótese em que a CONTRATADA retirará as menções de seus meios digitais em até 30 (trinta) dias e deixará de usá-las em novos materiais, não sendo exigível o recolhimento de materiais já impressos ou distribuídos.",
        "9.4. Esta autorização não transfere qualquer direito sobre a marca, que permanece de titularidade exclusiva da CONTRATANTE, nos termos da Lei nº 9.279/1996.",
      ] },
      { title: "CLÁUSULA 10ª – DA NÃO SOLICITAÇÃO", paragraphs: [
        "10.1. Durante o Contrato e por 12 (doze) meses após seu término, nenhuma das PARTES contratará diretamente colaboradores ou consultores da outra que tenham atuado no projeto, sem anuência prévia e escrita.",
      ] },
      { title: "CLÁUSULA 11ª – DA RESPONSABILIDADE", paragraphs: [
        "11.1. A responsabilidade total da CONTRATADA por danos diretos decorrentes deste Contrato limita-se ao valor efetivamente recebido, excluídos lucros cessantes e danos indiretos, salvo dolo ou culpa grave e violação de confidencialidade.",
      ] },
      { title: "CLÁUSULA 12ª – DA RESCISÃO", paragraphs: [
        "12.1. Qualquer PARTE poderá rescindir este Contrato, sem justa causa, mediante aviso prévio escrito de 30 (trinta) dias, sendo devidos os valores dos serviços executados até a data do término.",
        "12.2. A rescisão imediata poderá ocorrer em caso de descumprimento contratual não sanado em 10 (dez) dias após notificação, falência ou recuperação judicial da outra PARTE.",
        "12.3. As Cláusulas 6ª, 7ª, 8ª, 9ª e 10ª sobrevivem ao término deste Contrato.",
      ] },
      { title: "CLÁUSULA 13ª – DISPOSIÇÕES GERAIS", paragraphs: [
        "13.1. Não há vínculo empregatício, societário ou de representação entre as PARTES ou seus colaboradores.",
        "13.2. Este Contrato só poderá ser alterado por aditivo escrito. A tolerância de uma PARTE não implica renúncia ou novação.",
        "13.3. As PARTES reconhecem a validade da assinatura eletrônica deste instrumento, nos termos da MP nº 2.200-2/2001 e da Lei nº 14.063/2020.",
        "13.4. Integram este Contrato: ANEXO I – Orçamento e Cronograma aprovados; e o NDA referido na Cláusula 6ª.",
        `13.5. Fica eleito o foro da Comarca de ${blank(i.city)} para dirimir quaisquer controvérsias, com renúncia a qualquer outro.`,
      ] },
    ],
    closing: [`${blank(i.city)}, ${blank(i.date)}.`],
  };
}

export function annexLines(q: QuoteAnnex | null | undefined): string[] {
  if (!q) return ["Nenhum orçamento selecionado. Selecione o orçamento aprovado pelo cliente."];
  return [
    `Serviço: ${q.service_title}`,
    `Valor total aprovado: ${q.total}`,
    `Início previsto: ${q.start_date || "a definir"} · Término previsto: ${q.end_date || "a definir"}`,
    `Orçamento emitido em ${q.issued_at} (arquivo ${q.file_name}), cujas etapas, atividades, prazos e valores integram este Contrato.`,
  ];
}
