import { z } from "zod";

export const companyBrandSchema = z.object({
  name: z.string().trim().min(1).max(120),
  website: z.string().trim().max(300).default(""),
  logo: z.string().max(2_800_000).refine(v => !v || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v), "Use uma imagem PNG, JPEG ou WebP."),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).or(z.literal("")),
  contact: z.string().trim().max(200).default(""),
  email: z.string().email().max(200).or(z.literal("")),
  phone: z.string().trim().max(60).default(""),
  segment: z.string().trim().max(200).default(""),
  address: z.string().trim().max(500).default(""),
  description: z.string().trim().max(2000).default(""),
  linkedin: z.string().trim().max(300).default(""),
  instagram: z.string().trim().max(300).default(""),
});
export type CompanyBrand = z.infer<typeof companyBrandSchema>;
export const emptyCompanyBrand: CompanyBrand = { name: "", website: "", logo: "", color: "", contact: "", email: "", phone: "", segment: "", address: "", description: "", linkedin: "", instagram: "" };

/** Explicit edits, including empty values, always win over asynchronous defaults. */
export function mergeCompanyDefaults(current: CompanyBrand, defaults: Partial<CompanyBrand>, edited: ReadonlySet<keyof CompanyBrand>): CompanyBrand {
  const next = { ...current };
  for (const key of Object.keys(emptyCompanyBrand) as (keyof CompanyBrand)[]) {
    if (!edited.has(key) && !current[key] && defaults[key]) next[key] = defaults[key];
  }
  return next;
}

export const companyBrandCopy = {
  pt: { title: "Sua empresa", website: "Site da empresa", read: "Preencher pelo site", reading: "Lendo site…", name: "Nome da empresa", logo: "Logomarca", color: "Cor da marca", contact: "Nome do contato", email: "E-mail", phone: "Telefone", segment: "Segmento", address: "Endereço", description: "Sobre a empresa", apply: "Confirmar dados", manual: "Não foi possível ler o site. Confira o endereço ou preencha os dados manualmente.", image: "Escolha PNG, JPEG ou WebP de até 2 MB.", done: "Dados públicos encontrados. Confirme ou edite; campos não encontrados permanecem disponíveis para preenchimento." },
  en: { title: "Your company", website: "Company website", read: "Fill from website", reading: "Reading website…", name: "Company name", logo: "Logo", color: "Brand color", contact: "Contact name", email: "Email", phone: "Phone", segment: "Industry", address: "Address", description: "About the company", apply: "Confirm details", manual: "Could not read the website. Check the address or enter details manually.", image: "Choose PNG, JPEG or WebP up to 2 MB.", done: "Public details found. Confirm or edit; missing fields remain available for manual entry." },
  es: { title: "Su empresa", website: "Sitio de la empresa", read: "Completar desde el sitio", reading: "Leyendo sitio…", name: "Nombre de la empresa", logo: "Logotipo", color: "Color de marca", contact: "Nombre del contacto", email: "Correo electrónico", phone: "Teléfono", segment: "Sector", address: "Dirección", description: "Sobre la empresa", apply: "Confirmar datos", manual: "No se pudo leer el sitio. Compruebe la dirección o complete los datos manualmente.", image: "Elija PNG, JPEG o WebP de hasta 2 MB.", done: "Datos públicos encontrados. Confirme o edite; complete manualmente los campos faltantes." },
  zh: { title: "您的企业", website: "企业网站", read: "从网站填写", reading: "正在读取网站…", name: "企业名称", logo: "标志", color: "品牌颜色", contact: "联系人姓名", email: "电子邮箱", phone: "电话", segment: "行业", address: "地址", description: "企业简介", apply: "确认信息", manual: "无法读取网站。请检查网址或手动填写。", image: "请选择不超过2 MB的PNG、JPEG或WebP图片。", done: "已找到公开信息。请确认或修改，并补充未找到的字段。" },
} as const;