/** Campos do cadastro de novo consultor (perfil público + dados pessoais/contratuais). */
export type OnboardingLogo = { name: string; url: string };

export type OnboardingData = {
  full_name: string;
  photo_url: string;
  headline: string;
  education: string;
  experience: string;
  clients: string;
  works: string;
  specialties: string[];
  segments: string[];
  years_experience: number;
  certifications: string[];
  highlights: string[];
  academic_logos: OnboardingLogo[];
  client_logos: OnboardingLogo[];
  orcid_url: string;
  lattes_url: string;
  website_url: string;
  email: string;
  phone: string;
  birth_date: string;
  cpf: string;
  rg: string;
  nationality: string;
  marital_status: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_district: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  bank_name: string;
  bank_branch: string;
  bank_account: string;
  pix_key: string;
};

export const EMPTY_ONBOARDING: OnboardingData = {
  full_name: "",
  photo_url: "",
  headline: "",
  education: "",
  experience: "",
  clients: "",
  works: "",
  specialties: [],
  segments: [],
  years_experience: 0,
  certifications: [],
  highlights: [],
  academic_logos: [],
  client_logos: [],
  orcid_url: "",
  lattes_url: "",
  website_url: "",
  email: "",
  phone: "",
  birth_date: "",
  cpf: "",
  rg: "",
  nationality: "brasileira",
  marital_status: "",
  address_street: "",
  address_number: "",
  address_complement: "",
  address_district: "",
  address_city: "",
  address_state: "",
  address_zip: "",
  address_country: "Brasil",
  bank_name: "",
  bank_branch: "",
  bank_account: "",
  pix_key: "",
};

export const ONBOARDING_STATUS_LABEL: Record<string, string> = {
  sent: "Link enviado",
  submitted: "Cadastro recebido",
  approved: "Aprovado — contrato enviado",
  rejected: "Recusado",
};
