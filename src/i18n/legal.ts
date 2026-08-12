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
        "Esta política descreve como a Liberato Consulting coleta, usa, compartilha e protege dados pessoais em seu site, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018). Ela cobre visitantes, interessados em nossos serviços, inscritos na newsletter, candidatos a vagas, autores de conteúdo e pessoas com acesso ao painel administrativo.",
      sections: [
        {
          heading: "Quem somos e quem é o controlador",
          body: [
            "A Liberato Consulting é a controladora dos dados pessoais tratados neste site. Contato para assuntos de privacidade: contato@liberatoconsulting.com.br.",
          ],
        },
        {
          heading: "Perfis de usuário e dados coletados",
          body: [
            "Visitante: dados técnicos de navegação (endereço IP, tipo de dispositivo, idioma, páginas visitadas, origem do acesso) e preferências de personalização (segmento, região e estado escolhidos na barra de filtros de Dados do Brasil), guardadas no seu navegador.",
            "Interessado em serviços (lead): nome, empresa, e-mail, telefone, país, serviço de interesse e mensagem enviada pelos formulários de contato das páginas de serviço ou pelo canal de WhatsApp.",
            "Inscrito na newsletter: e-mail, nome (quando informado), idioma, data de inscrição e registros de envio, abertura ou cancelamento.",
            "Candidato (Trabalhe Conosco): nome completo, celular, e-mail, área de interesse, arquivo de currículo e link do LinkedIn.",
            "Autor de conteúdo: nome, e-mail, biografia curta, artigo enviado (texto, PDF/DOC), imagem de capa e créditos de autoria.",
            "Consultor, autor cadastrado e administrador: dados de conta (e-mail, senha em formato criptografado, perfil de acesso), dados de identificação e fiscais quando necessários à relação contratual, e registros de aceite do contrato digital.",
            "Métricas de conteúdo: contagem de leituras, avaliações por estrelas e compartilhamentos, tratadas de forma agregada sempre que possível.",
            "Dados antispam e de segurança: endereço IP, data/hora de envio e resultado das verificações de formulário.",
          ],
        },
        {
          heading: "Como usamos os dados",
          body: [
            "Responder solicitações de contato, elaborar propostas comerciais e dar seguimento a relacionamentos de negócio.",
            "Avaliar candidaturas enviadas na área Trabalhe Conosco e comunicar o resultado.",
            "Gerenciar inscrições e enviar a newsletter, incluindo avisos de novos conteúdos, sempre com opção de cancelamento.",
            "Receber, revisar, editar e publicar artigos enviados na área de conteúdo.",
            "Criar e administrar contas de acesso, controlar perfis (administrador, consultor, autor), registrar aprovações e formalizar contratos digitais.",
            "Personalizar banners, textos e indicadores exibidos conforme segmento, região e estado selecionados.",
            "Medir audiência, prevenir spam e fraudes, e melhorar a experiência do site.",
          ],
        },
        {
          heading: "Uso de inteligência artificial",
          body: [
            "Utilizamos ferramentas de inteligência artificial para traduzir automaticamente o conteúdo do site para inglês, espanhol e mandarim, apoiar a redação e a criação de imagens de materiais editoriais e organizar indicadores sobre o mercado brasileiro.",
            "Esse uso incide sobre o conteúdo institucional e editorial. Não submetemos currículos, dados de leads ou dados de conta a ferramentas de IA para decisões automatizadas sobre pessoas: candidaturas e propostas são avaliadas por nossa equipe.",
          ],
        },
        {
          heading: "Bases legais",
          body: [
            "Consentimento (newsletter, cookies não essenciais e envio voluntário de artigos e currículos).",
            "Execução de contrato ou procedimentos preliminares (propostas, cadastro de consultores e autores, contrato digital).",
            "Cumprimento de obrigação legal ou regulatória (registros fiscais e contábeis).",
            "Legítimo interesse (segurança, prevenção de spam, medição de audiência e melhoria dos serviços).",
          ],
        },
        {
          heading: "Compartilhamento e transferência internacional",
          body: [
            "Não vendemos dados pessoais. Podemos compartilhar dados com prestadores de serviço de hospedagem, banco de dados, armazenamento de arquivos, envio de e-mail, análise de audiência e provedores de modelos de inteligência artificial, sempre sob obrigação de confidencialidade e apenas no necessário para operar o site.",
            "Alguns desses prestadores podem estar localizados fora do Brasil. Nesses casos, adotamos salvaguardas contratuais compatíveis com a LGPD para a transferência internacional de dados.",
          ],
        },
        {
          heading: "Retenção e segurança",
          body: [
            "Leads e mensagens de contato: mantidos enquanto durar o relacionamento comercial e por prazo adicional razoável para defesa de direitos.",
            "Currículos: mantidos por até 24 meses, salvo pedido de exclusão anterior.",
            "Inscrições na newsletter: mantidas até o cancelamento, com registro do descadastramento para evitar novos envios.",
            "Contas de acesso e contratos digitais: mantidos durante a vigência da relação e pelos prazos legais aplicáveis.",
            "Adotamos medidas técnicas e organizacionais razoáveis, como controle de acesso por perfil, políticas de segurança no banco de dados, criptografia de senhas e restrição de acesso aos arquivos enviados.",
          ],
        },
        {
          heading: "Seus direitos",
          body: [
            "Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, informação sobre compartilhamento, revogação do consentimento e exclusão dos seus dados.",
            "Inscritos na newsletter podem cancelar o recebimento a qualquer momento pelo link presente em cada mensagem.",
            "Para exercer esses direitos, escreva para contato@liberatoconsulting.com.br.",
          ],
        },
        {
          heading: "Cookies e armazenamento local",
          body: [
            "Utilizamos cookies essenciais para o funcionamento do site, cookies opcionais de medição de audiência e armazenamento local para lembrar idioma, escolha de cookies e filtros de personalização.",
            "A escolha registrada na barra de cookies fica salva no seu navegador e pode ser alterada a qualquer momento limpando os dados do site.",
          ],
        },
        {
          heading: "Menores de idade",
          body: [
            "O site é destinado a profissionais e empresas. Não coletamos intencionalmente dados de menores de 18 anos. Caso identifique esse tipo de envio, entre em contato para que os dados sejam excluídos.",
          ],
        },
        {
          heading: "Contato",
          body: ["Dúvidas sobre esta política: contato@liberatoconsulting.com.br."],
        },
      ],
    },
    terms: {
      title: "Termos de Uso",
      updated: "Última atualização: agosto de 2026",
      intro:
        "Ao acessar e utilizar o site da Liberato Consulting, incluindo formulários, newsletter, área de conteúdo e áreas de acesso restrito, você concorda com os termos abaixo.",
      sections: [
        {
          heading: "Objeto do site",
          body: [
            "Este site apresenta serviços de consultoria em gestão estratégica, empreendedorismo, operações e pesquisas de mercado sobre o Brasil, além de conteúdos informativos, indicadores sobre o mercado brasileiro e canais de relacionamento.",
          ],
        },
        {
          heading: "Uso permitido",
          body: [
            "Você se compromete a utilizar o site de forma lícita, sem tentar acessar áreas restritas sem autorização, contornar mecanismos de segurança ou antispam, sobrecarregar a infraestrutura, coletar dados de terceiros ou enviar spam, malware ou conteúdo ilegal por meio dos formulários e uploads.",
          ],
        },
        {
          heading: "Cadastros e contas de acesso",
          body: [
            "Algumas áreas exigem cadastro e são liberadas mediante aprovação, com perfis distintos de administrador, consultor e autor, cada um com permissões específicas.",
            "Você é responsável pela veracidade dos dados informados e pela guarda das suas credenciais, respondendo pelas ações realizadas com sua conta. Comunique imediatamente qualquer uso não autorizado.",
            "Podemos suspender ou encerrar contas em caso de violação destes termos, inatividade prolongada ou encerramento da relação profissional.",
          ],
        },
        {
          heading: "Contrato digital de consultores e parceiros",
          body: [
            "Consultores, autores e parceiros podem ter o acesso condicionado ao aceite de um contrato digital disponibilizado na área restrita. O aceite eletrônico, com registro de data, hora e identificação do usuário, é válido como manifestação de vontade nos termos da legislação brasileira.",
            "As condições comerciais, de remuneração e de confidencialidade constam do contrato específico e prevalecem sobre estes termos naquilo que for divergente.",
          ],
        },
        {
          heading: "Envio de conteúdo por autores",
          body: [
            "Ao enviar um artigo, arquivo, imagem de capa ou material pela área de conteúdo, você declara ser titular dos direitos ou possuir autorização para uso, e concede à Liberato Consulting licença gratuita e não exclusiva para publicar, traduzir, adaptar formatos, distribuir em newsletter e redes sociais e divulgar o material com os devidos créditos.",
            "Reservamo-nos o direito de revisar, editar, recusar ou remover conteúdos que não atendam aos nossos critérios editoriais, legais ou de qualidade.",
          ],
        },
        {
          heading: "Newsletter e comunicações",
          body: [
            "A inscrição na newsletter é voluntária e autoriza o envio de conteúdos, novidades e materiais relacionados aos nossos serviços. O cancelamento pode ser feito a qualquer momento pelo link disponível nas mensagens.",
          ],
        },
        {
          heading: "Personalização de dados exibidos",
          body: [
            "Os filtros de segmento, região e estado ajustam banners, textos e indicadores apresentados. Trata-se de recorte informativo baseado nas fontes disponíveis e pode não refletir integralmente a realidade de cada mercado ou localidade.",
          ],
        },
        {
          heading: "Conteúdo, IA e propriedade intelectual",
          body: [
            "Textos, marcas, logotipos, layout e materiais publicados pertencem à Liberato Consulting ou a seus autores. A reprodução depende de autorização prévia, exceto citações com indicação da fonte.",
            "Parte das traduções, resumos e imagens do site é produzida com apoio de inteligência artificial e revisada por nossa equipe. Ainda assim, podem ocorrer imprecisões; a versão em português prevalece em caso de divergência entre idiomas.",
          ],
        },
        {
          heading: "Natureza informativa",
          body: [
            "Os conteúdos, dados de mercado, indicadores econômicos e informações sobre o Brasil têm caráter informativo e não constituem aconselhamento jurídico, contábil, tributário ou de investimento. Decisões tomadas com base neles são de responsabilidade do usuário.",
          ],
        },
        {
          heading: "Limitação de responsabilidade",
          body: [
            "Empregamos esforços razoáveis para manter o site disponível e as informações atualizadas, mas não garantimos ausência de erros, interrupções ou perda de arquivos enviados, nem respondemos por danos indiretos decorrentes do uso do site.",
          ],
        },
        {
          heading: "Links de terceiros",
          body: [
            "O site pode conter links para sites externos, redes sociais e canais de mensagem, como WhatsApp e LinkedIn, cujo conteúdo e políticas são de responsabilidade dos respectivos operadores.",
          ],
        },
        {
          heading: "Privacidade",
          body: [
            "O tratamento de dados pessoais decorrente do uso do site é regido pela nossa Política de Privacidade, que integra estes termos.",
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
        "This policy describes how Liberato Consulting collects, uses, shares and protects personal data on its website, in line with the Brazilian data protection law (LGPD - Law 13.709/2018). It covers visitors, prospects, newsletter subscribers, job applicants, content authors and people with access to the admin panel.",
      sections: [
        {
          heading: "Who we are and who is the controller",
          body: [
            "Liberato Consulting is the controller of personal data processed on this website. Privacy contact: contato@liberatoconsulting.com.br.",
          ],
        },
        {
          heading: "User profiles and data collected",
          body: [
            "Visitor: technical browsing data (IP address, device type, language, pages visited, traffic source) and personalization preferences (segment, region and state chosen in the Brazil Data filter bar), stored in your browser.",
            "Prospect (lead): name, company, e-mail, phone, country, service of interest and message sent through service page forms or the WhatsApp channel.",
            "Newsletter subscriber: e-mail, name (when provided), language, subscription date and sending, opening or unsubscribe records.",
            "Job applicant (Careers): full name, mobile number, e-mail, area of interest, resume file and LinkedIn link.",
            "Content author: name, e-mail, short bio, submitted article (text, PDF/DOC), cover image and authorship credits.",
            "Consultant, registered author and administrator: account data (e-mail, encrypted password, access role), identification and tax data when required by the contractual relationship, and digital contract acceptance records.",
            "Content metrics: read counts, star ratings and shares, processed in aggregate whenever possible.",
            "Anti-spam and security data: IP address, submission timestamp and form verification results.",
          ],
        },
        {
          heading: "How we use data",
          body: [
            "Reply to contact requests, prepare proposals and follow up on business relationships.",
            "Assess applications sent through the Careers area and communicate results.",
            "Manage subscriptions and send the newsletter, including new content alerts, always with an unsubscribe option.",
            "Receive, review, edit and publish articles submitted in the content area.",
            "Create and manage accounts, control roles (administrator, consultant, author), record approvals and formalize digital contracts.",
            "Personalize banners, texts and indicators according to the selected segment, region and state.",
            "Measure audience, prevent spam and fraud, and improve the website experience.",
          ],
        },
        {
          heading: "Use of artificial intelligence",
          body: [
            "We use AI tools to automatically translate site content into English, Spanish and Mandarin, to support drafting and image creation for editorial materials, and to organize indicators about the Brazilian market.",
            "This use applies to institutional and editorial content. We do not submit resumes, lead data or account data to AI tools for automated decisions about individuals: applications and proposals are reviewed by our team.",
          ],
        },
        {
          heading: "Legal bases",
          body: [
            "Consent (newsletter, non-essential cookies and voluntary submission of articles and resumes).",
            "Performance of a contract or preliminary steps (proposals, consultant and author registration, digital contract).",
            "Compliance with legal or regulatory obligations (tax and accounting records).",
            "Legitimate interest (security, spam prevention, audience measurement and service improvement).",
          ],
        },
        {
          heading: "Sharing and international transfers",
          body: [
            "We do not sell personal data. We may share data with hosting, database, file storage, e-mail delivery, analytics and AI model providers, always under confidentiality obligations and only as needed to operate the website.",
            "Some of these providers may be located outside Brazil. In those cases we adopt contractual safeguards compatible with the LGPD for international data transfers.",
          ],
        },
        {
          heading: "Retention and security",
          body: [
            "Leads and contact messages: kept for the duration of the business relationship and a reasonable additional period to defend rights.",
            "Resumes: kept for up to 24 months, unless deletion is requested earlier.",
            "Newsletter subscriptions: kept until cancellation, with an unsubscribe record to prevent further sending.",
            "Accounts and digital contracts: kept during the relationship and for applicable legal periods.",
            "We adopt reasonable technical and organizational measures such as role-based access control, database security policies, password encryption and restricted access to uploaded files.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "You may request confirmation of processing, access, correction, anonymization, portability, information about sharing, withdrawal of consent and deletion of your data.",
            "Newsletter subscribers may unsubscribe at any time through the link in each message.",
            "To exercise these rights, write to contato@liberatoconsulting.com.br.",
          ],
        },
        {
          heading: "Cookies and local storage",
          body: [
            "We use essential cookies for the website to work, optional analytics cookies and local storage to remember language, cookie choice and personalization filters.",
            "Your choice in the cookie bar is stored in your browser and can be changed at any time by clearing site data.",
          ],
        },
        {
          heading: "Minors",
          body: [
            "The website is intended for professionals and companies. We do not knowingly collect data from people under 18. If you identify such a submission, contact us so the data can be deleted.",
          ],
        },
        {
          heading: "Contact",
          body: ["Questions about this policy: contato@liberatoconsulting.com.br."],
        },
      ],
    },
    terms: {
      title: "Terms of Use",
      updated: "Last updated: August 2026",
      intro:
        "By accessing and using the Liberato Consulting website, including forms, newsletter, content area and restricted areas, you agree to the terms below.",
      sections: [
        {
          heading: "Purpose of the website",
          body: [
            "This website presents consulting services in strategic management, entrepreneurship, operations and market research about Brazil, as well as informational content, Brazilian market indicators and contact channels.",
          ],
        },
        {
          heading: "Permitted use",
          body: [
            "You agree to use the website lawfully, without attempting to access restricted areas without authorization, bypass security or anti-spam mechanisms, overload the infrastructure, scrape third-party data or send spam, malware or illegal content through forms and uploads.",
          ],
        },
        {
          heading: "Registration and accounts",
          body: [
            "Some areas require registration and are released upon approval, with distinct administrator, consultant and author roles, each with specific permissions.",
            "You are responsible for the accuracy of the data provided and for safeguarding your credentials, and you are liable for actions taken with your account. Report any unauthorized use immediately.",
            "We may suspend or terminate accounts in case of breach of these terms, prolonged inactivity or the end of the professional relationship.",
          ],
        },
        {
          heading: "Digital contract for consultants and partners",
          body: [
            "Consultants, authors and partners may have access conditioned on accepting a digital contract available in the restricted area. Electronic acceptance, with date, time and user identification records, is valid as a declaration of intent under Brazilian law.",
            "Commercial, compensation and confidentiality conditions are set out in the specific contract, which prevails over these terms where they differ.",
          ],
        },
        {
          heading: "Content submitted by authors",
          body: [
            "By submitting an article, file, cover image or material through the content area, you declare that you own the rights or are authorized to use them, and grant Liberato Consulting a free, non-exclusive license to publish, translate, adapt formats, distribute via newsletter and social media and promote the material with due credit.",
            "We reserve the right to review, edit, refuse or remove content that does not meet our editorial, legal or quality criteria.",
          ],
        },
        {
          heading: "Newsletter and communications",
          body: [
            "Newsletter subscription is voluntary and authorizes us to send content, news and materials related to our services. You may unsubscribe at any time through the link in the messages.",
          ],
        },
        {
          heading: "Personalization of displayed data",
          body: [
            "Segment, region and state filters adjust the banners, texts and indicators shown. This is an informational view based on available sources and may not fully reflect the reality of each market or location.",
          ],
        },
        {
          heading: "Content, AI and intellectual property",
          body: [
            "Texts, trademarks, logos, layout and published materials belong to Liberato Consulting or their authors. Reproduction requires prior authorization, except for quotes with source attribution.",
            "Part of the translations, summaries and images on the site is produced with AI support and reviewed by our team. Inaccuracies may still occur; the Portuguese version prevails in case of discrepancy between languages.",
          ],
        },
        {
          heading: "Informational nature",
          body: [
            "Content, market data, economic indicators and information about Brazil are informational and do not constitute legal, accounting, tax or investment advice. Decisions based on them are the user's responsibility.",
          ],
        },
        {
          heading: "Limitation of liability",
          body: [
            "We make reasonable efforts to keep the website available and information up to date, but we do not guarantee the absence of errors, interruptions or loss of uploaded files, nor are we liable for indirect damages arising from use of the website.",
          ],
        },
        {
          heading: "Third-party links",
          body: [
            "The website may contain links to external sites, social networks and messaging channels such as WhatsApp and LinkedIn, whose content and policies are the responsibility of their operators.",
          ],
        },
        {
          heading: "Privacy",
          body: [
            "Processing of personal data arising from use of the website is governed by our Privacy Policy, which is part of these terms.",
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
        "Esta política describe cómo Liberato Consulting recopila, usa, comparte y protege datos personales en su sitio web, conforme a la ley brasileña de protección de datos (LGPD - Ley 13.709/2018). Abarca visitantes, interesados en nuestros servicios, suscriptores de la newsletter, candidatos, autores de contenido y personas con acceso al panel administrativo.",
      sections: [
        {
          heading: "Quiénes somos y quién es el responsable",
          body: [
            "Liberato Consulting es la responsable del tratamiento de los datos personales en este sitio. Contacto de privacidad: contato@liberatoconsulting.com.br.",
          ],
        },
        {
          heading: "Perfiles de usuario y datos recopilados",
          body: [
            "Visitante: datos técnicos de navegación (dirección IP, tipo de dispositivo, idioma, páginas visitadas, origen del acceso) y preferencias de personalización (segmento, región y estado elegidos en la barra de filtros de Datos de Brasil), guardadas en su navegador.",
            "Interesado (lead): nombre, empresa, correo electrónico, teléfono, país, servicio de interés y mensaje enviado por los formularios de las páginas de servicio o por el canal de WhatsApp.",
            "Suscriptor de la newsletter: correo electrónico, nombre (si se informa), idioma, fecha de suscripción y registros de envío, apertura o baja.",
            "Candidato (Trabaje con Nosotros): nombre completo, móvil, correo electrónico, área de interés, archivo de currículum y enlace de LinkedIn.",
            "Autor de contenido: nombre, correo electrónico, biografía breve, artículo enviado (texto, PDF/DOC), imagen de portada y créditos de autoría.",
            "Consultor, autor registrado y administrador: datos de cuenta (correo, contraseña cifrada, perfil de acceso), datos de identificación y fiscales cuando sean necesarios para la relación contractual, y registros de aceptación del contrato digital.",
            "Métricas de contenido: número de lecturas, valoraciones con estrellas y compartidos, tratados de forma agregada siempre que sea posible.",
            "Datos antispam y de seguridad: dirección IP, fecha y hora de envío y resultado de las verificaciones del formulario.",
          ],
        },
        {
          heading: "Cómo usamos los datos",
          body: [
            "Responder solicitudes de contacto, elaborar propuestas comerciales y dar seguimiento a relaciones de negocio.",
            "Evaluar candidaturas enviadas en el área Trabaje con Nosotros y comunicar el resultado.",
            "Gestionar suscripciones y enviar la newsletter, incluidos avisos de nuevos contenidos, siempre con opción de baja.",
            "Recibir, revisar, editar y publicar artículos enviados en el área de contenidos.",
            "Crear y administrar cuentas de acceso, controlar perfiles (administrador, consultor, autor), registrar aprobaciones y formalizar contratos digitales.",
            "Personalizar banners, textos e indicadores según el segmento, la región y el estado seleccionados.",
            "Medir audiencia, prevenir spam y fraudes, y mejorar la experiencia del sitio.",
          ],
        },
        {
          heading: "Uso de inteligencia artificial",
          body: [
            "Usamos herramientas de inteligencia artificial para traducir automáticamente el contenido del sitio al inglés, español y mandarín, apoyar la redacción y creación de imágenes de materiales editoriales y organizar indicadores sobre el mercado brasileño.",
            "Este uso recae sobre el contenido institucional y editorial. No enviamos currículums, datos de leads ni datos de cuenta a herramientas de IA para decisiones automatizadas sobre personas: las candidaturas y propuestas son evaluadas por nuestro equipo.",
          ],
        },
        {
          heading: "Bases legales",
          body: [
            "Consentimiento (newsletter, cookies no esenciales y envío voluntario de artículos y currículums).",
            "Ejecución de contrato o trámites previos (propuestas, registro de consultores y autores, contrato digital).",
            "Cumplimiento de obligaciones legales o regulatorias (registros fiscales y contables).",
            "Interés legítimo (seguridad, prevención de spam, medición de audiencia y mejora de los servicios).",
          ],
        },
        {
          heading: "Compartición y transferencia internacional",
          body: [
            "No vendemos datos personales. Podemos compartirlos con proveedores de alojamiento, base de datos, almacenamiento de archivos, envío de correo, analítica y modelos de inteligencia artificial, siempre bajo obligación de confidencialidad y solo en lo necesario para operar el sitio.",
            "Algunos de estos proveedores pueden estar fuera de Brasil. En esos casos adoptamos salvaguardas contractuales compatibles con la LGPD para la transferencia internacional de datos.",
          ],
        },
        {
          heading: "Conservación y seguridad",
          body: [
            "Leads y mensajes de contacto: conservados mientras dure la relación comercial y por un plazo adicional razonable para la defensa de derechos.",
            "Currículums: conservados hasta 24 meses, salvo solicitud previa de eliminación.",
            "Suscripciones a la newsletter: conservadas hasta la baja, con registro de la cancelación para evitar nuevos envíos.",
            "Cuentas de acceso y contratos digitales: conservados durante la relación y por los plazos legales aplicables.",
            "Adoptamos medidas técnicas y organizativas razonables, como control de acceso por perfil, políticas de seguridad en la base de datos, cifrado de contraseñas y acceso restringido a los archivos enviados.",
          ],
        },
        {
          heading: "Sus derechos",
          body: [
            "Puede solicitar confirmación del tratamiento, acceso, corrección, anonimización, portabilidad, información sobre compartición, revocación del consentimiento y eliminación de sus datos.",
            "Los suscriptores de la newsletter pueden darse de baja en cualquier momento mediante el enlace incluido en cada mensaje.",
            "Para ejercer estos derechos, escriba a contato@liberatoconsulting.com.br.",
          ],
        },
        {
          heading: "Cookies y almacenamiento local",
          body: [
            "Usamos cookies esenciales para el funcionamiento del sitio, cookies opcionales de medición y almacenamiento local para recordar el idioma, la elección de cookies y los filtros de personalización.",
            "Su elección en la barra de cookies se guarda en el navegador y puede cambiarse en cualquier momento borrando los datos del sitio.",
          ],
        },
        {
          heading: "Menores de edad",
          body: [
            "El sitio está dirigido a profesionales y empresas. No recopilamos intencionalmente datos de menores de 18 años. Si detecta un envío de este tipo, contáctenos para eliminar los datos.",
          ],
        },
        {
          heading: "Contacto",
          body: ["Dudas sobre esta política: contato@liberatoconsulting.com.br."],
        },
      ],
    },
    terms: {
      title: "Términos de Uso",
      updated: "Última actualización: agosto de 2026",
      intro:
        "Al acceder y utilizar el sitio de Liberato Consulting, incluidos formularios, newsletter, área de contenidos y áreas restringidas, usted acepta los términos siguientes.",
      sections: [
        {
          heading: "Objeto del sitio",
          body: [
            "Este sitio presenta servicios de consultoría en gestión estratégica, emprendimiento, operaciones e investigaciones de mercado sobre Brasil, además de contenidos informativos, indicadores del mercado brasileño y canales de relación.",
          ],
        },
        {
          heading: "Uso permitido",
          body: [
            "Usted se compromete a usar el sitio de forma lícita, sin intentar acceder a áreas restringidas sin autorización, eludir mecanismos de seguridad o antispam, sobrecargar la infraestructura, extraer datos de terceros ni enviar spam, malware o contenido ilegal mediante los formularios y cargas de archivos.",
          ],
        },
        {
          heading: "Registros y cuentas de acceso",
          body: [
            "Algunas áreas requieren registro y se habilitan tras aprobación, con perfiles distintos de administrador, consultor y autor, cada uno con permisos específicos.",
            "Usted es responsable de la veracidad de los datos informados y de la custodia de sus credenciales, respondiendo por las acciones realizadas con su cuenta. Comunique de inmediato cualquier uso no autorizado.",
            "Podemos suspender o cerrar cuentas en caso de incumplimiento de estos términos, inactividad prolongada o fin de la relación profesional.",
          ],
        },
        {
          heading: "Contrato digital de consultores y socios",
          body: [
            "Los consultores, autores y socios pueden tener el acceso condicionado a la aceptación de un contrato digital disponible en el área restringida. La aceptación electrónica, con registro de fecha, hora e identificación del usuario, es válida como manifestación de voluntad conforme a la legislación brasileña.",
            "Las condiciones comerciales, de remuneración y de confidencialidad constan en el contrato específico, que prevalece sobre estos términos en lo que sea divergente.",
          ],
        },
        {
          heading: "Envío de contenido por autores",
          body: [
            "Al enviar un artículo, archivo, imagen de portada o material por el área de contenidos, usted declara ser titular de los derechos o contar con autorización, y concede a Liberato Consulting una licencia gratuita y no exclusiva para publicar, traducir, adaptar formatos, distribuir por newsletter y redes sociales y divulgar el material con los créditos correspondientes.",
            "Nos reservamos el derecho de revisar, editar, rechazar o retirar contenidos que no cumplan nuestros criterios editoriales, legales o de calidad.",
          ],
        },
        {
          heading: "Newsletter y comunicaciones",
          body: [
            "La suscripción a la newsletter es voluntaria y autoriza el envío de contenidos, novedades y materiales relacionados con nuestros servicios. La baja puede realizarse en cualquier momento mediante el enlace de los mensajes.",
          ],
        },
        {
          heading: "Personalización de los datos mostrados",
          body: [
            "Los filtros de segmento, región y estado ajustan los banners, textos e indicadores presentados. Se trata de un recorte informativo basado en las fuentes disponibles y puede no reflejar íntegramente la realidad de cada mercado o localidad.",
          ],
        },
        {
          heading: "Contenido, IA y propiedad intelectual",
          body: [
            "Textos, marcas, logotipos, diseño y materiales publicados pertenecen a Liberato Consulting o a sus autores. La reproducción requiere autorización previa, salvo citas con indicación de la fuente.",
            "Parte de las traducciones, resúmenes e imágenes del sitio se produce con apoyo de inteligencia artificial y es revisada por nuestro equipo. Aun así pueden ocurrir imprecisiones; la versión en portugués prevalece en caso de divergencia entre idiomas.",
          ],
        },
        {
          heading: "Carácter informativo",
          body: [
            "Los contenidos, datos de mercado, indicadores económicos e informaciones sobre Brasil son informativos y no constituyen asesoramiento jurídico, contable, fiscal o de inversión. Las decisiones basadas en ellos son responsabilidad del usuario.",
          ],
        },
        {
          heading: "Limitación de responsabilidad",
          body: [
            "Realizamos esfuerzos razonables para mantener el sitio disponible y la información actualizada, pero no garantizamos ausencia de errores, interrupciones o pérdida de archivos enviados, ni respondemos por daños indirectos derivados del uso del sitio.",
          ],
        },
        {
          heading: "Enlaces de terceros",
          body: [
            "El sitio puede contener enlaces a sitios externos, redes sociales y canales de mensajería como WhatsApp y LinkedIn, cuyo contenido y políticas son responsabilidad de sus operadores.",
          ],
        },
        {
          heading: "Privacidad",
          body: [
            "El tratamiento de datos personales derivado del uso del sitio se rige por nuestra Política de Privacidad, que forma parte de estos términos.",
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
        "本政策说明 Liberato Consulting 如何在其网站上收集、使用、共享和保护个人数据，并遵守巴西数据保护法（LGPD - 第 13.709/2018 号法律）。适用于访问者、潜在客户、订阅者、求职者、内容作者以及拥有管理后台权限的人员。",
      sections: [
        {
          heading: "我们是谁及数据控制者",
          body: [
            "Liberato Consulting 是本网站个人数据的控制者。隐私事务联系方式：contato@liberatoconsulting.com.br。",
          ],
        },
        {
          heading: "用户类型与收集的数据",
          body: [
            "访问者：技术浏览数据（IP 地址、设备类型、语言、访问页面、访问来源）以及个性化偏好（在“巴西数据”筛选栏中选择的行业、地区和州），保存在您的浏览器中。",
            "潜在客户：通过服务页面表单或 WhatsApp 渠道提交的姓名、公司、电子邮件、电话、国家、关注的服务和留言。",
            "通讯订阅者：电子邮件、姓名（如提供）、语言、订阅日期以及发送、打开或退订记录。",
            "求职者（加入我们）：全名、手机号、电子邮件、意向领域、简历文件和 LinkedIn 链接。",
            "内容作者：姓名、电子邮件、简短简介、提交的文章（正文、PDF/DOC）、封面图片和署名信息。",
            "顾问、注册作者与管理员：账户数据（电子邮件、加密密码、访问角色）、合同关系所需的身份与税务资料，以及数字合同的接受记录。",
            "内容指标：阅读次数、星级评分和分享数据，尽可能以汇总方式处理。",
            "反垃圾与安全数据：IP 地址、提交时间及表单验证结果。",
          ],
        },
        {
          heading: "数据用途",
          body: [
            "回复联系请求、编制商务提案并跟进业务关系。",
            "评估通过招聘专区提交的申请并反馈结果。",
            "管理订阅并发送通讯，包括新内容提醒，始终提供退订选项。",
            "接收、审阅、编辑并发布在内容专区提交的文章。",
            "创建和管理访问账户，控制角色（管理员、顾问、作者），记录审批并签署数字合同。",
            "根据所选行业、地区和州个性化展示横幅、文案和指标。",
            "衡量访问量、防止垃圾信息和欺诈，并改善网站体验。",
          ],
        },
        {
          heading: "人工智能的使用",
          body: [
            "我们使用人工智能工具将网站内容自动翻译为英语、西班牙语和中文，协助撰写与生成编辑材料的图片，并整理巴西市场指标。",
            "该使用仅涉及机构和编辑内容。我们不会将简历、潜在客户数据或账户数据提交给 AI 工具用于对个人的自动化决策：申请与提案均由我们的团队评估。",
          ],
        },
        {
          heading: "法律依据",
          body: [
            "同意（通讯订阅、非必要 Cookie 以及自愿提交文章和简历）。",
            "合同履行或前期步骤（提案、顾问与作者注册、数字合同）。",
            "履行法律或监管义务（税务与会计记录）。",
            "正当利益（安全、防垃圾信息、访问量衡量与服务改进）。",
          ],
        },
        {
          heading: "共享与跨境传输",
          body: [
            "我们不出售个人数据。我们可能与主机、数据库、文件存储、邮件发送、分析和人工智能模型服务提供商共享数据，且始终受保密义务约束，仅限网站运营所需。",
            "部分服务提供商可能位于巴西境外。在此情况下，我们采取符合 LGPD 的合同保障措施进行跨境数据传输。",
          ],
        },
        {
          heading: "保存与安全",
          body: [
            "潜在客户与联系信息：在业务关系存续期间保存，并在合理的额外期限内用于权利主张。",
            "简历：最长保存 24 个月，另有删除请求的除外。",
            "通讯订阅：保存至退订为止，并保留退订记录以避免再次发送。",
            "访问账户与数字合同：在关系存续期间及适用法定期限内保存。",
            "我们采取合理的技术和组织措施，例如基于角色的访问控制、数据库安全策略、密码加密以及对上传文件的访问限制。",
          ],
        },
        {
          heading: "您的权利",
          body: [
            "您可以请求确认处理情况、访问、更正、匿名化、可携带性、共享信息、撤回同意以及删除您的数据。",
            "通讯订阅者可随时通过每封邮件中的链接退订。",
            "如需行使这些权利，请发送邮件至 contato@liberatoconsulting.com.br。",
          ],
        },
        {
          heading: "Cookie 与本地存储",
          body: [
            "我们使用网站运行所必需的 Cookie、可选的分析 Cookie，以及本地存储来记住语言、Cookie 选择和个性化筛选条件。",
            "您在 Cookie 提示栏中的选择保存在浏览器中，可随时通过清除网站数据进行更改。",
          ],
        },
        {
          heading: "未成年人",
          body: [
            "本网站面向专业人士和企业。我们不会有意收集未满 18 周岁人员的数据。如发现此类提交，请联系我们以便删除。",
          ],
        },
        {
          heading: "联系我们",
          body: ["有关本政策的问题：contato@liberatoconsulting.com.br。"],
        },
      ],
    },
    terms: {
      title: "使用条款",
      updated: "最后更新：2026 年 8 月",
      intro:
        "访问和使用 Liberato Consulting 网站（包括表单、通讯、内容专区和受限区域）即表示您同意以下条款。",
      sections: [
        {
          heading: "网站目的",
          body: [
            "本网站介绍战略管理、创业、运营和巴西市场研究方面的咨询服务，以及信息类内容、巴西市场指标和联系渠道。",
          ],
        },
        {
          heading: "允许的使用",
          body: [
            "您承诺合法使用本网站，不得未经授权访问受限区域、规避安全或反垃圾机制、使基础设施过载、抓取第三方数据，或通过表单和上传功能发送垃圾信息、恶意软件或非法内容。",
          ],
        },
        {
          heading: "注册与访问账户",
          body: [
            "部分区域需要注册并经审批后开通，设有管理员、顾问和作者等不同角色，各自拥有特定权限。",
            "您应对所提供信息的真实性以及凭证的保管负责，并对使用您账户实施的行为承担责任。如发现未经授权的使用，请立即通知我们。",
            "若违反本条款、长期不活跃或职业关系终止，我们可暂停或注销账户。",
          ],
        },
        {
          heading: "顾问与合作伙伴的数字合同",
          body: [
            "顾问、作者和合作伙伴的访问权限可能以接受受限区域内提供的数字合同为前提。带有日期、时间和用户标识记录的电子接受，依巴西法律具有意思表示效力。",
            "商务、报酬和保密条件以具体合同为准，与本条款不一致的部分以该合同为准。",
          ],
        },
        {
          heading: "作者提交的内容",
          body: [
            "通过内容专区提交文章、文件、封面图片或材料，即表示您声明拥有相关权利或已获授权，并授予 Liberato Consulting 免费、非独占许可，以发布、翻译、调整格式、通过通讯和社交媒体分发并在注明署名的情况下推广该材料。",
            "对于不符合我们编辑、法律或质量标准的内容，我们保留审阅、编辑、拒绝或删除的权利。",
          ],
        },
        {
          heading: "通讯与沟通",
          body: [
            "通讯订阅为自愿行为，表示授权我们发送与服务相关的内容、资讯和材料。您可随时通过邮件中的链接退订。",
          ],
        },
        {
          heading: "展示数据的个性化",
          body: [
            "行业、地区和州筛选条件会调整所展示的横幅、文案和指标。这是基于现有来源的信息性视角，可能无法完全反映各市场或地区的实际情况。",
          ],
        },
        {
          heading: "内容、人工智能与知识产权",
          body: [
            "文本、商标、标识、版式和已发布材料归 Liberato Consulting 或其作者所有。除注明出处的引用外，转载须事先获得授权。",
            "网站部分翻译、摘要和图片由人工智能协助生成并经我们团队审核。仍可能出现不准确之处；各语言版本如有差异，以葡萄牙语版本为准。",
          ],
        },
        {
          heading: "信息性质",
          body: [
            "内容、市场数据、经济指标和关于巴西的信息仅供参考，不构成法律、会计、税务或投资建议。基于这些信息做出的决定由用户自行负责。",
          ],
        },
        {
          heading: "责任限制",
          body: [
            "我们尽合理努力保持网站可用和信息更新，但不保证没有错误、中断或上传文件丢失，也不对因使用本网站产生的间接损害负责。",
          ],
        },
        {
          heading: "第三方链接",
          body: [
            "本网站可能包含指向外部网站、社交网络及 WhatsApp、LinkedIn 等消息渠道的链接，其内容和政策由相应运营方负责。",
          ],
        },
        {
          heading: "隐私",
          body: ["因使用本网站而产生的个人数据处理受我们的隐私政策约束，该政策构成本条款的一部分。"],
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
