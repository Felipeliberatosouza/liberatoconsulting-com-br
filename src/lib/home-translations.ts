/**
 * Textos fixos da página inicial e componentes compartilhados (botões,
 * títulos de seção, FAQ complementar). PT é a fonte; EN/ES/ZH seguem a mesma estrutura.
 */
import type { Lang } from "@/i18n/config";

type Faq = { question: string; answer: string };

const pt = {
  freeTools: "Ferramentas de gestão grátis",
  talkExperts: "Fale com nossos especialistas",
  contactUs: "Fale conosco",
  downloadTools: "Baixe Ferramentas de Gestão — Grátis!",
  clients: "Clientes",
  clientsAria: "Clientes da Liberato Consulting",
  bannerAlt: "Consultoria orientada a resultados",
  impactEyebrow: "Resultados",
  impactTitle: "O Impacto que traremos para o seu negócio",
  faqEyebrow: "Perguntas frequentes",
  faqTitle: "O que você precisa saber antes de começar",
  highlightedFor: "Conteúdo destacado para",
  prevBanner: "Banner anterior",
  nextBanner: "Próximo banner",
  keywordsTitle: "Consultoria empresarial: temas mais procurados",
  footerNewsletter: "Receba nossos conteúdos sobre gestão, IA e o mercado brasileiro.",
  interactiveTitle: "Ferramentas interativas",
  interactiveBody: "Informe os dados do seu negócio e receba resultados, gráfico e relatório em PDF e PowerPoint.",
  extraFaq: [
      {
          "question": "Como a empresa é classificada por porte?",
          "answer": "Usamos a classificação Sebrae por número de funcionários e setor: Micro, Pequena, Média e Grande Empresa. Microempresas têm menos de 10 funcionários em comércio e serviços e menos de 20 na indústria. O planejamento considera também o desafio e a estrutura da empresa."
      },
      {
          "question": "O que são as ferramentas interativas de gestão?",
          "answer": "São calculadoras em que você informa dados do negócio e recebe resultados, gráficos e relatórios em PDF e PowerPoint. As fórmulas passam por testes e auditoria antes da publicação. A modalidade de acesso é indicada em cada ferramenta."
      },
      {
          "question": "Como funciona o diagnóstico empresarial?",
          "answer": "Após o escopo inicial, você recebe um link curto com perguntas preparadas para seu serviço. As perguntas podem oferecer uma ou mais alternativas e pedem detalhes obrigatórios para contextualizar a resposta. As respostas são salvas para apoiar o planejamento e o orçamento."
      },
      {
          "question": "Vocês oferecem treinamentos in company?",
          "answer": "Sim. Oferecemos programas de capacitação em liderança, vendas, finanças, processos e IA aplicada, entre outros temas. O conteúdo, os materiais e o planejamento são ajustados à necessidade da equipe."
      },
      {
          "question": "O que recebo na Newsletter Insights e no Boletim Semanal?",
          "answer": "Liberato Insights apresenta o artigo publicado mais recente, ferramentas ou guia de gestão e o Radar Brasil, com notícias econômicas ou políticas e possíveis impactos nos negócios. O Boletim Semanal reúne indicadores do Brasil. Os conteúdos incluem links cruzados e alternam ferramentas e guia para evitar repetições."
      },
      {
          "question": "A Liberato Consulting apoia empresas estrangeiras no Brasil?",
          "answer": "Sim. Produzimos pesquisas e dados de mercado para decisões de entrada, expansão e investimento no Brasil. O site possui versões em português, inglês, espanhol e chinês."
      },
      {
          "question": "Quais são as etapas de um projeto?",
          "answer": "São seis etapas: Escopo Inicial; Diagnóstico; Precificação e Orçamentos; Apresentações; Contrato e NDA; Satisfação do Cliente. O NDA é prévio à troca de informações confidenciais, mesmo que sua gestão esteja na quinta etapa."
      },
      {
          "question": "Todas as ferramentas são gratuitas?",
          "answer": "Não. Cada ferramenta pode ser gratuita, paga ou gratuita com indicação de amigo. Consulte a modalidade na ferramenta. O cadastro é gratuito; criar uma conta não dispensa o pagamento ou a indicação quando exigidos."
      },
      {
          "question": "Como obtenho acesso gratuito indicando um amigo?",
          "answer": "Nas ferramentas com essa modalidade, informe o e-mail ou WhatsApp de um amigo que autorizou o convite. Quando o envio é aceito, a ferramenta é liberada para você. O convite apresenta a ferramenta e oferece uma opção para não receber novas indicações."
      },
      {
          "question": "O amigo indicado precisa se cadastrar?",
          "answer": "O convite permite uma única abertura da ferramenta sem cadastro. Na segunda tentativa, o amigo deve criar uma conta e seguir a modalidade vigente: gratuita, paga ou gratuita com indicação. Não compartilhe o link exclusivo do convite."
      },
      {
          "question": "Como funciona o pagamento de uma ferramenta?",
          "answer": "Quando a modalidade paga estiver disponível, a cobrança é processada pelo Asaas por PIX, boleto ou cartão. O acesso depende da confirmação do pagamento. Os dados do cartão são preenchidos no ambiente seguro do Asaas e não são armazenados neste site."
      },
      {
          "question": "Como são apresentados os cenários do orçamento?",
          "answer": "O Cenário 1 preserva o planejamento do diagnóstico. Até dois cenários adicionais podem retirar atividades ou aplicar redução proporcional, com uma observação sobre o que muda. Cada cenário apresenta seu investimento e prazo; o orçamento gerado fica disponível para consulta."
      },
      {
          "question": "A apresentação comercial considera o orçamento?",
          "answer": "Sim. Ao preparar a apresentação, a consultoria pode selecionar um orçamento já gerado para usar seu preço, suas etapas e seus prazos nos slides correspondentes. O orçamento continua sendo o documento de referência da proposta."
      },
      {
          "question": "Como minhas informações são protegidas pelo NDA e pelo contrato?",
          "answer": "O NDA é assinado antes da troca de informações confidenciais para planejamento e orçamento. O contrato reforça a confidencialidade e inclui o orçamento aprovado como anexo. A assinatura eletrônica utiliza confirmação por código de e-mail e registra data, horário e IP vinculados ao documento."
      },
      {
          "question": "Minha marca pode ser divulgada como cliente?",
          "answer": "O contrato define as condições de uso da marca e da razão social para identificar a empresa como cliente da Liberato Consulting. Esse uso deve respeitar a identidade da marca e não autoriza divulgar informações confidenciais. Consulte e alinhe as condições antes de assinar."
      },
      {
          "question": "Como autorizo ou cancelo o recebimento de mensagens?",
          "answer": "Quando um administrador inclui um serviço de conteúdo em seu cadastro, você recebe um link para autorizar o recebimento; antes da aprovação, esse conteúdo não é enviado. As mensagens disponibilizam descadastro. A autorização fica registrada com data, horário e IP."
      },
      {
          "question": "Como funciona a pesquisa de satisfação?",
          "answer": "A consultoria envia um formulário por link, com pesquisa adequada a serviços executados ou não executados. As respostas ajudam a avaliar a experiência e orientar melhorias. Candidaturas de Trabalhe Conosco não integram essa atividade."
      }
  ] as Faq[],
};

type HomeDict = typeof pt;

const en: HomeDict = {
  freeTools: "Free management tools",
  talkExperts: "Talk to our experts",
  contactUs: "Contact us",
  downloadTools: "Download Management Tools — Free!",
  clients: "Clients",
  clientsAria: "Liberato Consulting clients",
  bannerAlt: "Results-driven consulting",
  impactEyebrow: "Results",
  impactTitle: "The impact we will bring to your business",
  faqEyebrow: "Frequently asked questions",
  faqTitle: "What you need to know before getting started",
  highlightedFor: "Content highlighted for",
  prevBanner: "Previous banner",
  nextBanner: "Next banner",
  keywordsTitle: "Business consulting: most searched topics",
  footerNewsletter: "Get our content on management, AI and the Brazilian market.",
  interactiveTitle: "Interactive tools",
  interactiveBody: "Enter your business data and get results, charts and a PDF and PowerPoint report.",
  extraFaq: [
      {
          "question": "How are companies classified by size?",
          "answer": "We use Sebrae classifications based on employee count and sector: Micro, Small, Medium and Large. Micro companies have fewer than 10 employees in retail and services and fewer than 20 in industry. Planning also considers the challenge and company structure."
      },
      {
          "question": "What are interactive management tools?",
          "answer": "They are calculators where you enter business data and receive results, charts and PDF and PowerPoint reports. Formulas undergo testing and an audit before publication. Each tool specifies its access mode."
      },
      {
          "question": "How does the business diagnostic work?",
          "answer": "After the initial scope, you receive a short link with questions prepared for your service. Questions may offer single or multiple choices and require explanatory details. Responses are saved to support planning and the quote."
      },
      {
          "question": "Do you offer in-company training?",
          "answer": "Yes. Training covers leadership, sales, finance, processes and applied AI, among other topics. Content, materials and planning are tailored to the team’s needs."
      },
      {
          "question": "What do I receive in Insights and the Weekly Bulletin?",
          "answer": "Liberato Insights features the latest published article, tools or a management guide, and Brazil Radar with economic or political news and potential business impacts. The Weekly Bulletin compiles Brazilian indicators. Both include cross-links and alternate tools and guides to avoid repetition."
      },
      {
          "question": "Does Liberato Consulting support foreign companies in Brazil?",
          "answer": "Yes. We produce market research and data for entry, expansion and investment decisions in Brazil. The website is available in Portuguese, English, Spanish and Chinese."
      },
      {
          "question": "What are the stages of a project?",
          "answer": "There are six stages: Initial Scope; Diagnostic; Pricing and Quotes; Presentations; Contract and NDA; Customer Satisfaction. The NDA precedes confidential information sharing, even though it is managed in the fifth stage."
      },
      {
          "question": "Are all tools free?",
          "answer": "No. Each tool may be free, paid or free with a friend referral. Check its access mode. Registration is free, but creating an account does not waive a required payment or referral."
      },
      {
          "question": "How do I unlock a tool by referring a friend?",
          "answer": "For referral-enabled tools, enter the email or WhatsApp number of a friend who has authorized the invitation. Once sending is accepted, the tool is unlocked for you. The invitation introduces the tool and offers an opt-out from further referrals."
      },
      {
          "question": "Does the referred friend need an account?",
          "answer": "The invitation allows one opening of the tool without registration. On the second attempt, the friend must create an account and follow the current access mode: free, paid or free with referral. Do not share the exclusive invitation link."
      },
      {
          "question": "How do tool payments work?",
          "answer": "When paid access is available, Asaas processes payment by PIX, bank slip (boleto) or card. Access depends on payment confirmation. Card details are entered in Asaas’ secure checkout and are not stored on this website."
      },
      {
          "question": "How are quote scenarios presented?",
          "answer": "Scenario 1 preserves the diagnostic plan. Up to two additional scenarios can remove activities or apply a proportional reduction, with a note explaining the changes. Each scenario shows its investment and timeline; generated quotes remain available for viewing."
      },
      {
          "question": "Does the commercial presentation use the quote?",
          "answer": "Yes. When preparing a presentation, the consultancy can select an existing quote to use its price, stages and timelines in the relevant slides. The quote remains the proposal’s reference document."
      },
      {
          "question": "How do the NDA and contract protect my information?",
          "answer": "The NDA is signed before sharing confidential information for planning and pricing. The contract reinforces confidentiality and includes the approved quote as an annex. Electronic signing uses an email verification code and records the date, time and IP linked to the document."
      },
      {
          "question": "Can my brand be shown as a client?",
          "answer": "The contract defines how the brand and legal company name may identify the company as a Liberato Consulting client. Use must respect brand identity and does not authorize disclosure of confidential information. Review and agree on the conditions before signing."
      },
      {
          "question": "How do I authorize or stop receiving messages?",
          "answer": "When an administrator adds a content service to your profile, you receive an approval link; that content is not sent before approval. Messages provide an unsubscribe option. Approval is recorded with the date, time and IP."
      },
      {
          "question": "How does the satisfaction survey work?",
          "answer": "The consultancy sends a form link with a survey appropriate to completed or unperformed services. Responses help assess the experience and guide improvements. Careers applications are not included in this activity."
      }
  ],
};

const es: HomeDict = {
  freeTools: "Herramientas de gestión gratis",
  talkExperts: "Hable con nuestros especialistas",
  contactUs: "Contáctenos",
  downloadTools: "Descargue Herramientas de Gestión — ¡Gratis!",
  clients: "Clientes",
  clientsAria: "Clientes de Liberato Consulting",
  bannerAlt: "Consultoría orientada a resultados",
  impactEyebrow: "Resultados",
  impactTitle: "El impacto que traeremos a su negocio",
  faqEyebrow: "Preguntas frecuentes",
  faqTitle: "Lo que necesita saber antes de empezar",
  highlightedFor: "Contenido destacado para",
  prevBanner: "Banner anterior",
  nextBanner: "Siguiente banner",
  keywordsTitle: "Consultoría empresarial: temas más buscados",
  footerNewsletter: "Reciba nuestros contenidos sobre gestión, IA y el mercado brasileño.",
  interactiveTitle: "Herramientas interactivas",
  interactiveBody: "Ingrese los datos de su negocio y reciba resultados, gráficos e informe en PDF y PowerPoint.",
  extraFaq: [
      {
          "question": "¿Cómo se clasifica la empresa por tamaño?",
          "answer": "Usamos la clasificación Sebrae por número de empleados y sector: Micro, Pequeña, Mediana y Gran Empresa. Las microempresas tienen menos de 10 empleados en comercio y servicios y menos de 20 en industria. La planificación también considera el desafío y la estructura de la empresa."
      },
      {
          "question": "¿Qué son las herramientas interactivas de gestión?",
          "answer": "Son calculadoras donde ingresa datos del negocio y recibe resultados, gráficos e informes en PDF y PowerPoint. Las fórmulas pasan por pruebas y auditoría antes de publicarse. Cada herramienta indica su modalidad de acceso."
      },
      {
          "question": "¿Cómo funciona el diagnóstico empresarial?",
          "answer": "Tras el alcance inicial, recibe un enlace corto con preguntas preparadas para su servicio. Pueden ofrecer una o varias alternativas y exigen detalles explicativos. Las respuestas se guardan para apoyar la planificación y el presupuesto."
      },
      {
          "question": "¿Ofrecen capacitación in company?",
          "answer": "Sí. Ofrecemos programas sobre liderazgo, ventas, finanzas, procesos e IA aplicada, entre otros temas. El contenido, los materiales y la planificación se ajustan a las necesidades del equipo."
      },
      {
          "question": "¿Qué recibo en Insights y el Boletín Semanal?",
          "answer": "Liberato Insights presenta el último artículo publicado, herramientas o una guía de gestión y Radar Brasil, con noticias económicas o políticas y posibles impactos en los negocios. El Boletín Semanal reúne indicadores brasileños. Ambos incluyen enlaces cruzados y alternan herramientas y guía para evitar repeticiones."
      },
      {
          "question": "¿Liberato Consulting apoya a empresas extranjeras en Brasil?",
          "answer": "Sí. Producimos estudios y datos de mercado para decisiones de entrada, expansión e inversión en Brasil. El sitio está disponible en portugués, inglés, español y chino."
      },
      {
          "question": "¿Cuáles son las etapas de un proyecto?",
          "answer": "Son seis: Alcance Inicial; Diagnóstico; Precios y Presupuestos; Presentaciones; Contrato y NDA; Satisfacción del Cliente. El NDA precede al intercambio de información confidencial, aunque se gestione en la quinta etapa."
      },
      {
          "question": "¿Todas las herramientas son gratuitas?",
          "answer": "No. Cada herramienta puede ser gratuita, de pago o gratuita con recomendación a un amigo. Consulte su modalidad. El registro es gratuito, pero no elimina el pago o la recomendación cuando sean necesarios."
      },
      {
          "question": "¿Cómo accedo gratis recomendando a un amigo?",
          "answer": "En las herramientas con esta modalidad, ingrese el correo o WhatsApp de un amigo que haya autorizado la invitación. Cuando se acepta el envío, se habilita la herramienta para usted. La invitación presenta la herramienta y permite rechazar nuevas recomendaciones."
      },
      {
          "question": "¿El amigo recomendado necesita registrarse?",
          "answer": "La invitación permite una única apertura sin registro. En el segundo intento, debe crear una cuenta y respetar la modalidad vigente: gratuita, de pago o gratuita con recomendación. No comparta el enlace exclusivo de invitación."
      },
      {
          "question": "¿Cómo se paga una herramienta?",
          "answer": "Cuando el acceso de pago esté disponible, Asaas procesa el cobro por PIX, boleto o tarjeta. El acceso depende de la confirmación del pago. Los datos de tarjeta se ingresan en el entorno seguro de Asaas y no se almacenan en este sitio."
      },
      {
          "question": "¿Cómo se presentan los escenarios del presupuesto?",
          "answer": "El Escenario 1 mantiene el plan del diagnóstico. Hasta dos escenarios adicionales pueden eliminar actividades o aplicar una reducción proporcional, con una observación sobre los cambios. Cada escenario presenta inversión y plazo; el presupuesto generado queda disponible para consulta."
      },
      {
          "question": "¿La presentación comercial utiliza el presupuesto?",
          "answer": "Sí. Al preparar la presentación, la consultoría puede seleccionar un presupuesto generado para usar su precio, etapas y plazos en las diapositivas correspondientes. El presupuesto sigue siendo el documento de referencia de la propuesta."
      },
      {
          "question": "¿Cómo protegen mis datos el NDA y el contrato?",
          "answer": "El NDA se firma antes de intercambiar información confidencial para planificación y presupuesto. El contrato refuerza la confidencialidad e incluye el presupuesto aprobado como anexo. La firma electrónica usa un código por correo y registra fecha, hora e IP vinculados al documento."
      },
      {
          "question": "¿Mi marca puede divulgarse como cliente?",
          "answer": "El contrato define las condiciones de uso de la marca y la razón social para identificar a la empresa como cliente de Liberato Consulting. Debe respetarse la identidad de marca y no se autoriza divulgar información confidencial. Revise y acuerde las condiciones antes de firmar."
      },
      {
          "question": "¿Cómo autorizo o cancelo las comunicaciones?",
          "answer": "Cuando un administrador añade un servicio de contenido a su registro, recibe un enlace de autorización; ese contenido no se envía antes de aprobarlo. Las comunicaciones permiten darse de baja. La autorización registra fecha, hora e IP."
      },
      {
          "question": "¿Cómo funciona la encuesta de satisfacción?",
          "answer": "La consultoría envía un formulario por enlace, adecuado a servicios ejecutados o no ejecutados. Las respuestas ayudan a evaluar la experiencia y orientar mejoras. Las candidaturas de Trabaje con Nosotros no participan en esta actividad."
      }
  ],
};

const zh: HomeDict = {
  freeTools: "免费管理工具",
  talkExperts: "联系我们的专家",
  contactUs: "联系我们",
  downloadTools: "免费下载管理工具！",
  clients: "客户",
  clientsAria: "Liberato Consulting 的客户",
  bannerAlt: "以结果为导向的咨询",
  impactEyebrow: "成果",
  impactTitle: "我们将为您的企业带来的影响",
  faqEyebrow: "常见问题",
  faqTitle: "开始之前您需要了解的内容",
  highlightedFor: "重点内容面向",
  prevBanner: "上一张横幅",
  nextBanner: "下一张横幅",
  keywordsTitle: "企业咨询：热门主题",
  footerNewsletter: "获取有关管理、人工智能和巴西市场的内容。",
  interactiveTitle: "互动工具",
  interactiveBody: "输入您的企业数据，即可获得结果、图表以及 PDF 和 PowerPoint 报告。",
  extraFaq: [
      {
          "question": "企业规模如何划分？",
          "answer": "我们依据 Sebrae 的员工人数和行业标准划分微型、小型、中型和大型企业。商业与服务业微型企业员工少于 10 人，工业少于 20 人。规划也会考虑企业面临的挑战和组织结构。"
      },
      {
          "question": "什么是互动管理工具？",
          "answer": "输入业务数据后，这些计算工具会提供结果、图表以及 PDF 和 PowerPoint 报告。公式在发布前经过测试和审核。每个工具都会标明使用方式。"
      },
      {
          "question": "企业诊断如何进行？",
          "answer": "初步范围确认后，您会收到一个简短链接，回答针对所需服务制定的问题。问题可提供单选或多选，并要求填写解释性细节。回答会被保存，用于制定规划和报价。"
      },
      {
          "question": "你们提供企业内训吗？",
          "answer": "提供。培训涵盖领导力、销售、财务、流程和人工智能应用等主题。内容、资料和规划根据团队需求定制。"
      },
      {
          "question": "Insights 和每周简报包含什么？",
          "answer": "Liberato Insights 包含最新发布的文章、管理工具或指南，以及巴西观察栏目，分析经济或政治新闻及其潜在商业影响。每周简报汇总巴西指标。两者包含交叉链接，并轮换工具与指南以减少重复。"
      },
      {
          "question": "是否支持外国企业进入巴西？",
          "answer": "是的。我们为进入、扩张和投资巴西提供市场研究与数据。网站提供葡萄牙语、英语、西班牙语和中文版本。"
      },
      {
          "question": "项目有哪些阶段？",
          "answer": "共有六个阶段：初步范围、企业诊断、定价与报价、商业演示、合同与保密协议、客户满意度。保密协议必须在交换机密信息之前签署，尽管其管理归于第五阶段。"
      },
      {
          "question": "所有工具都免费吗？",
          "answer": "不是。每个工具可以免费、付费或通过推荐朋友免费使用。请查看工具的使用方式。注册账户免费，但不会免除必要的付款或推荐要求。"
      },
      {
          "question": "如何通过推荐朋友免费使用工具？",
          "answer": "对于支持推荐的工具，请填写已同意接收邀请的朋友的电子邮箱或 WhatsApp 号码。发送获接受后，工具会为您开通。邀请会介绍工具，并提供停止接收推荐消息的选项。"
      },
      {
          "question": "被推荐的朋友需要注册吗？",
          "answer": "邀请允许无需注册打开工具一次。第二次尝试时，朋友必须注册账户，并遵守工具当时的免费、付费或推荐使用规则。请勿分享专属邀请链接。"
      },
      {
          "question": "如何支付工具费用？",
          "answer": "提供付费使用时，Asaas 通过 PIX、银行付款单或银行卡处理付款。使用权在付款确认后开通。银行卡信息在 Asaas 安全页面填写，不会保存在本站。"
      },
      {
          "question": "报价方案如何呈现？",
          "answer": "方案一保留企业诊断中的原始规划。最多两个附加方案可以删除活动或按比例降价，并说明变化。每个方案显示投资金额和工期；已生成的报价可供查阅。"
      },
      {
          "question": "商业演示会使用报价数据吗？",
          "answer": "会。咨询团队准备演示时，可选择已生成的报价，将其价格、阶段和工期用于对应幻灯片。报价仍是商业提案的参考文件。"
      },
      {
          "question": "保密协议和合同如何保护我的信息？",
          "answer": "保密协议在交换用于规划和报价的机密信息之前签署。合同进一步明确保密义务，并附上获批准的报价。电子签署使用邮件验证码，并记录与文件关联的日期、时间和 IP 地址。"
      },
      {
          "question": "我的品牌可以作为客户案例展示吗？",
          "answer": "合同规定品牌和公司法定名称可如何用于将企业标识为 Liberato Consulting 的客户。使用必须尊重品牌形象，不得披露机密信息。请在签署前审核并确认条件。"
      },
      {
          "question": "如何授权或取消消息接收？",
          "answer": "管理员为您的资料添加内容服务时，您会收到授权链接；批准之前不会发送该内容。消息提供取消订阅选项。授权会记录日期、时间和 IP 地址。"
      },
      {
          "question": "客户满意度调查如何进行？",
          "answer": "咨询团队发送调查表链接，针对已执行或未执行的服务收集反馈。回答用于评估体验和改进服务。招聘申请不会纳入这项调查。"
      }
  ],
};

const DICTS: Record<Lang, HomeDict> = { pt, en, es, zh };

export function homeText(lang: Lang): HomeDict {
  return DICTS[lang] ?? pt;
}
