export type Lang = "pt" | "en" | "es" | "zh";

type Section = { heading: string; body: string[] };
type Doc = { title: string; updated: string; intro: string; sections: Section[] };

type LegalDict = {
  privacy: Doc;
  terms: Doc;
  cookies: {
    text: string;
    accept: string;
    reject: string;
    more: string;
  };
  footer: { privacy: string; terms: string; legal: string };
};

export const legal: Record<Lang, LegalDict> = {
  pt: {
    footer: { privacy: "Política de Privacidade", terms: "Termos de Uso", legal: "Legal" },
    cookies: {
      text: "Usamos cookies para melhorar sua experiência, medir audiência e entender o interesse por nossos conteúdos. Você pode aceitar ou recusar os cookies não essenciais.",
      accept: "Aceitar",
      reject: "Recusar",
      more: "Saiba mais",
    },
    privacy: {
      title: "Política de Privacidade",
      updated: "Última atualização: agosto de 2026",
      intro:
        "Esta política descreve como a Liberato Consulting coleta, usa e protege dados pessoais em seu site, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).",
      sections: [
        {
          heading: "Dados que coletamos",
          body: [
            "Dados fornecidos por você em formulários: nome, empresa, e-mail, telefone, país, área de interesse, currículo e links profissionais.",
            "Dados técnicos de navegação: endereço IP, tipo de dispositivo, idioma, páginas visitadas e origem do acesso.",
          ],
        },
        {
          heading: "Como usamos os dados",
          body: [
            "Responder solicitações de contato e propostas comerciais.",
            "Avaliar candidaturas enviadas na área Trabalhe Conosco.",
            "Enviar conteúdos e informações relacionadas aos nossos serviços, quando autorizado.",
            "Medir audiência, prevenir abusos e melhorar a experiência do site.",
          ],
        },
        {
          heading: "Bases legais",
          body: [
            "Tratamos dados com base no consentimento, na execução de contrato ou procedimentos preliminares e no legítimo interesse para segurança e melhoria dos serviços.",
          ],
        },
        {
          heading: "Compartilhamento",
          body: [
            "Não vendemos dados pessoais. Podemos compartilhar dados com prestadores de serviço de hospedagem, e-mail e análise, sempre sob obrigação de confidencialidade e apenas no necessário para a operação do site.",
          ],
        },
        {
          heading: "Retenção e segurança",
          body: [
            "Os dados são mantidos apenas pelo tempo necessário às finalidades descritas ou ao cumprimento de obrigações legais.",
            "Adotamos medidas técnicas e organizacionais razoáveis para proteger os dados contra acesso não autorizado, perda ou divulgação indevida.",
          ],
        },
        {
          heading: "Seus direitos",
          body: [
            "Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, revogação do consentimento e exclusão dos seus dados.",
            "Para exercer esses direitos, escreva para contato@liberato.com.",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "Utilizamos cookies essenciais para o funcionamento do site e cookies opcionais de medição de audiência. A escolha registrada na barra de cookies fica salva no seu navegador e pode ser alterada a qualquer momento limpando os dados do site.",
          ],
        },
        {
          heading: "Contato",
          body: ["Dúvidas sobre esta política: contato@liberato.com."],
        },
      ],
    },
    terms: {
      title: "Termos de Uso",
      updated: "Última atualização: agosto de 2026",
      intro:
        "Ao acessar e utilizar o site da Liberato Consulting, você concorda com os termos abaixo.",
      sections: [
        {
          heading: "Objeto do site",
          body: [
            "Este site apresenta serviços de consultoria em gestão empresarial, empreendedorismo, operações e pesquisas de mercado sobre o Brasil, além de conteúdos informativos.",
          ],
        },
        {
          heading: "Uso permitido",
          body: [
            "Você se compromete a utilizar o site de forma lícita, sem tentar acessar áreas restritas, sobrecarregar a infraestrutura, enviar spam ou conteúdo ilegal por meio dos formulários.",
          ],
        },
        {
          heading: "Conteúdo e propriedade intelectual",
          body: [
            "Textos, marcas, logotipos, layout e materiais publicados pertencem à Liberato Consulting ou a seus autores. A reprodução depende de autorização prévia, exceto citações com indicação da fonte.",
            "Ao enviar um artigo pela área de conteúdo, você declara ser titular dos direitos e autoriza sua publicação neste site.",
          ],
        },
        {
          heading: "Natureza informativa",
          body: [
            "Os conteúdos, dados de mercado e informações sobre o Brasil têm caráter informativo e não constituem aconselhamento jurídico, contábil, tributário ou de investimento. Decisões tomadas com base neles são de responsabilidade do usuário.",
          ],
        },
        {
          heading: "Limitação de responsabilidade",
          body: [
            "Empregamos esforços razoáveis para manter o site disponível e as informações atualizadas, mas não garantimos ausência de erros ou interrupções, nem respondemos por danos indiretos decorrentes do uso do site.",
          ],
        },
        {
          heading: "Links de terceiros",
          body: [
            "O site pode conter links para sites externos, cujo conteúdo e políticas são de responsabilidade dos respectivos operadores.",
          ],
        },
        {
          heading: "Alterações e foro",
          body: [
            "Podemos atualizar estes termos a qualquer momento, com efeito a partir da publicação nesta página.",
            "Aplica-se a legislação brasileira, com foro da comarca de São Paulo/SP.",
          ],
        },
      ],
    },
  },

  en: {
    footer: { privacy: "Privacy Policy", terms: "Terms of Use", legal: "Legal" },
    cookies: {
      text: "We use cookies to improve your experience, measure audience and understand interest in our content. You can accept or reject non-essential cookies.",
      accept: "Accept",
      reject: "Reject",
      more: "Learn more",
    },
    privacy: {
      title: "Privacy Policy",
      updated: "Last updated: August 2026",
      intro:
        "This policy describes how Liberato Consulting collects, uses and protects personal data on its website, in line with the Brazilian data protection law (LGPD - Law 13.709/2018).",
      sections: [
        {
          heading: "Data we collect",
          body: [
            "Data you provide in forms: name, company, e-mail, phone, country, area of interest, resume and professional links.",
            "Technical browsing data: IP address, device type, language, pages visited and traffic source.",
          ],
        },
        {
          heading: "How we use data",
          body: [
            "Reply to contact requests and business proposals.",
            "Assess applications sent through the Careers area.",
            "Send content and information related to our services, when authorized.",
            "Measure audience, prevent abuse and improve the website experience.",
          ],
        },
        {
          heading: "Legal bases",
          body: [
            "We process data based on consent, performance of a contract or preliminary steps, and legitimate interest for security and service improvement.",
          ],
        },
        {
          heading: "Sharing",
          body: [
            "We do not sell personal data. We may share data with hosting, e-mail and analytics providers, always under confidentiality obligations and only as needed to operate the website.",
          ],
        },
        {
          heading: "Retention and security",
          body: [
            "Data is kept only as long as necessary for the purposes described or to comply with legal obligations.",
            "We adopt reasonable technical and organizational measures to protect data against unauthorized access, loss or improper disclosure.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "You may request confirmation of processing, access, correction, anonymization, portability, withdrawal of consent and deletion of your data.",
            "To exercise these rights, write to contato@liberato.com.",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "We use essential cookies for the website to work and optional analytics cookies. Your choice in the cookie bar is stored in your browser and can be changed at any time by clearing site data.",
          ],
        },
        { heading: "Contact", body: ["Questions about this policy: contato@liberato.com."] },
      ],
    },
    terms: {
      title: "Terms of Use",
      updated: "Last updated: August 2026",
      intro:
        "By accessing and using the Liberato Consulting website, you agree to the terms below.",
      sections: [
        {
          heading: "Purpose of the website",
          body: [
            "This website presents consulting services in business management, entrepreneurship, operations and Brazilian market research, as well as informational content.",
          ],
        },
        {
          heading: "Permitted use",
          body: [
            "You agree to use the website lawfully, without attempting to access restricted areas, overload the infrastructure, or send spam or illegal content through the forms.",
          ],
        },
        {
          heading: "Content and intellectual property",
          body: [
            "Texts, trademarks, logos, layout and published materials belong to Liberato Consulting or their authors. Reproduction requires prior authorization, except for quotations citing the source.",
            "By submitting an article through the content area, you declare that you own the rights and authorize its publication on this website.",
          ],
        },
        {
          heading: "Informational nature",
          body: [
            "Content, market data and information about Brazil are informational and do not constitute legal, accounting, tax or investment advice. Decisions based on them are the user's responsibility.",
          ],
        },
        {
          heading: "Limitation of liability",
          body: [
            "We make reasonable efforts to keep the website available and information up to date, but we do not guarantee absence of errors or interruptions, nor are we liable for indirect damages arising from use of the website.",
          ],
        },
        {
          heading: "Third-party links",
          body: [
            "The website may contain links to external sites whose content and policies are the responsibility of their operators.",
          ],
        },
        {
          heading: "Changes and jurisdiction",
          body: [
            "We may update these terms at any time, effective upon publication on this page.",
            "Brazilian law applies, with jurisdiction in São Paulo/SP.",
          ],
        },
      ],
    },
  },

  es: {
    footer: { privacy: "Política de Privacidad", terms: "Términos de Uso", legal: "Legal" },
    cookies: {
      text: "Usamos cookies para mejorar su experiencia, medir la audiencia y entender el interés por nuestros contenidos. Puede aceptar o rechazar las cookies no esenciales.",
      accept: "Aceptar",
      reject: "Rechazar",
      more: "Más información",
    },
    privacy: {
      title: "Política de Privacidad",
      updated: "Última actualización: agosto de 2026",
      intro:
        "Esta política describe cómo Liberato Consulting recopila, usa y protege datos personales en su sitio web, conforme a la ley brasileña de protección de datos (LGPD - Ley 13.709/2018).",
      sections: [
        {
          heading: "Datos que recopilamos",
          body: [
            "Datos que usted proporciona en formularios: nombre, empresa, correo electrónico, teléfono, país, área de interés, currículum y enlaces profesionales.",
            "Datos técnicos de navegación: dirección IP, tipo de dispositivo, idioma, páginas visitadas y origen del acceso.",
          ],
        },
        {
          heading: "Cómo usamos los datos",
          body: [
            "Responder solicitudes de contacto y propuestas comerciales.",
            "Evaluar candidaturas enviadas en el área Trabaje con Nosotros.",
            "Enviar contenidos e información sobre nuestros servicios, cuando esté autorizado.",
            "Medir audiencia, prevenir abusos y mejorar la experiencia del sitio.",
          ],
        },
        {
          heading: "Bases legales",
          body: [
            "Tratamos los datos con base en el consentimiento, la ejecución de un contrato o trámites previos y el interés legítimo para seguridad y mejora de los servicios.",
          ],
        },
        {
          heading: "Compartición",
          body: [
            "No vendemos datos personales. Podemos compartirlos con proveedores de alojamiento, correo y analítica, siempre bajo obligación de confidencialidad y solo en lo necesario para operar el sitio.",
          ],
        },
        {
          heading: "Conservación y seguridad",
          body: [
            "Los datos se conservan solo el tiempo necesario para las finalidades descritas o para cumplir obligaciones legales.",
            "Adoptamos medidas técnicas y organizativas razonables para proteger los datos contra accesos no autorizados, pérdida o divulgación indebida.",
          ],
        },
        {
          heading: "Sus derechos",
          body: [
            "Puede solicitar confirmación del tratamiento, acceso, corrección, anonimización, portabilidad, revocación del consentimiento y eliminación de sus datos.",
            "Para ejercer estos derechos, escriba a contato@liberato.com.",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "Usamos cookies esenciales para el funcionamiento del sitio y cookies opcionales de medición. Su elección en la barra de cookies se guarda en el navegador y puede cambiarse en cualquier momento borrando los datos del sitio.",
          ],
        },
        { heading: "Contacto", body: ["Dudas sobre esta política: contato@liberato.com."] },
      ],
    },
    terms: {
      title: "Términos de Uso",
      updated: "Última actualización: agosto de 2026",
      intro:
        "Al acceder y utilizar el sitio de Liberato Consulting, usted acepta los términos siguientes.",
      sections: [
        {
          heading: "Objeto del sitio",
          body: [
            "Este sitio presenta servicios de consultoría en gestión empresarial, emprendimiento, operaciones e investigaciones de mercado sobre Brasil, además de contenidos informativos.",
          ],
        },
        {
          heading: "Uso permitido",
          body: [
            "Usted se compromete a usar el sitio de forma lícita, sin intentar acceder a áreas restringidas, sobrecargar la infraestructura ni enviar spam o contenido ilegal a través de los formularios.",
          ],
        },
        {
          heading: "Contenido y propiedad intelectual",
          body: [
            "Textos, marcas, logotipos, diseño y materiales publicados pertenecen a Liberato Consulting o a sus autores. La reproducción requiere autorización previa, salvo citas con indicación de la fuente.",
            "Al enviar un artículo por el área de contenidos, usted declara ser titular de los derechos y autoriza su publicación en este sitio.",
          ],
        },
        {
          heading: "Carácter informativo",
          body: [
            "Los contenidos, datos de mercado e informaciones sobre Brasil son informativos y no constituyen asesoramiento jurídico, contable, fiscal o de inversión. Las decisiones basadas en ellos son responsabilidad del usuario.",
          ],
        },
        {
          heading: "Limitación de responsabilidad",
          body: [
            "Realizamos esfuerzos razonables para mantener el sitio disponible y la información actualizada, pero no garantizamos ausencia de errores o interrupciones, ni respondemos por daños indirectos derivados del uso del sitio.",
          ],
        },
        {
          heading: "Enlaces de terceros",
          body: [
            "El sitio puede contener enlaces a sitios externos cuyo contenido y políticas son responsabilidad de sus operadores.",
          ],
        },
        {
          heading: "Cambios y jurisdicción",
          body: [
            "Podemos actualizar estos términos en cualquier momento, con efecto desde su publicación en esta página.",
            "Se aplica la legislación brasileña, con foro en São Paulo/SP.",
          ],
        },
      ],
    },
  },

  zh: {
    footer: { privacy: "隐私政策", terms: "使用条款", legal: "法律信息" },
    cookies: {
      text: "我们使用 Cookie 来改善您的体验、衡量访问量并了解您对内容的兴趣。您可以接受或拒绝非必要 Cookie。",
      accept: "接受",
      reject: "拒绝",
      more: "了解更多",
    },
    privacy: {
      title: "隐私政策",
      updated: "最后更新：2026 年 8 月",
      intro:
        "本政策说明 Liberato Consulting 如何在其网站上收集、使用和保护个人数据，并遵守巴西数据保护法（LGPD - 第 13.709/2018 号法律）。",
      sections: [
        {
          heading: "我们收集的数据",
          body: [
            "您在表单中提供的数据：姓名、公司、电子邮件、电话、国家、关注领域、简历和职业链接。",
            "技术浏览数据：IP 地址、设备类型、语言、访问页面和访问来源。",
          ],
        },
        {
          heading: "数据用途",
          body: [
            "回复联系请求和商务提案。",
            "评估通过招聘专区提交的申请。",
            "在获得授权时发送与我们服务相关的内容和信息。",
            "衡量访问量、防止滥用并改善网站体验。",
          ],
        },
        {
          heading: "法律依据",
          body: ["我们基于同意、合同履行或前期步骤以及安全与服务改进的正当利益处理数据。"],
        },
        {
          heading: "数据共享",
          body: [
            "我们不出售个人数据。我们可能与主机、邮件和分析服务提供商共享数据，且始终受保密义务约束，仅限网站运营所需。",
          ],
        },
        {
          heading: "保存与安全",
          body: [
            "数据仅在实现上述目的或履行法律义务所需的期限内保存。",
            "我们采取合理的技术和组织措施，防止未经授权的访问、丢失或不当披露。",
          ],
        },
        {
          heading: "您的权利",
          body: [
            "您可以请求确认处理情况、访问、更正、匿名化、可携带性、撤回同意以及删除您的数据。",
            "如需行使这些权利，请发送邮件至 contato@liberato.com。",
          ],
        },
        {
          heading: "Cookie",
          body: [
            "我们使用网站运行所必需的 Cookie 和可选的分析 Cookie。您在 Cookie 提示栏中的选择保存在浏览器中，可随时通过清除网站数据进行更改。",
          ],
        },
        { heading: "联系我们", body: ["有关本政策的问题：contato@liberato.com。"] },
      ],
    },
    terms: {
      title: "使用条款",
      updated: "最后更新：2026 年 8 月",
      intro: "访问和使用 Liberato Consulting 网站即表示您同意以下条款。",
      sections: [
        {
          heading: "网站目的",
          body: [
            "本网站介绍企业管理、创业、运营和巴西市场研究方面的咨询服务，以及信息类内容。",
          ],
        },
        {
          heading: "允许的使用",
          body: [
            "您承诺合法使用本网站，不尝试访问受限区域、不使基础设施过载，也不通过表单发送垃圾信息或非法内容。",
          ],
        },
        {
          heading: "内容与知识产权",
          body: [
            "文本、商标、标识、版式和已发布材料归 Liberato Consulting 或其作者所有。除注明出处的引用外，转载须事先获得授权。",
            "通过内容专区提交文章即表示您声明拥有相关权利，并授权在本网站发布。",
          ],
        },
        {
          heading: "信息性质",
          body: [
            "内容、市场数据和关于巴西的信息仅供参考，不构成法律、会计、税务或投资建议。基于这些信息做出的决定由用户自行负责。",
          ],
        },
        {
          heading: "责任限制",
          body: [
            "我们尽合理努力保持网站可用和信息更新，但不保证没有错误或中断，也不对因使用本网站产生的间接损害负责。",
          ],
        },
        {
          heading: "第三方链接",
          body: ["本网站可能包含外部网站链接，其内容和政策由相应运营方负责。"],
        },
        {
          heading: "变更与管辖",
          body: [
            "我们可能随时更新本条款，自本页面发布之日起生效。",
            "适用巴西法律，管辖地为圣保罗州圣保罗市。",
          ],
        },
      ],
    },
  },
};
