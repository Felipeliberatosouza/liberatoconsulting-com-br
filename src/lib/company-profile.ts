import { z } from "zod";
import { isValidPhone, PHONE_ERROR } from "./validation";

export type Partner = { name: string; cpf: string; share: string };

export type CompanyProfile = {
  id: string;
  legal_name: string;
  trade_name: string;
  cnpj: string;
  state_registration: string;
  municipal_registration: string;
  founded_on: string | null;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_district: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  email: string;
  phone: string;
  website: string;
  logo_url: string | null;
  partners: Partner[];
};

export const EMPTY_COMPANY: CompanyProfile = {
  id: "",
  legal_name: "",
  trade_name: "Liberato Consulting",
  cnpj: "",
  state_registration: "",
  municipal_registration: "",
  founded_on: null,
  address_street: "",
  address_number: "",
  address_complement: "",
  address_district: "",
  address_city: "",
  address_state: "",
  address_zip: "",
  address_country: "Brasil",
  email: "",
  phone: "",
  website: "",
  logo_url: null,
  partners: [],
};

export const companySchema = z.object({
  id: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().uuid().optional(),
  ),
  legal_name: z.string().trim().max(200).default(""),
  trade_name: z.string().trim().max(200).default(""),
  cnpj: z.string().trim().max(30).default(""),
  state_registration: z.string().trim().max(40).default(""),
  municipal_registration: z.string().trim().max(40).default(""),
  founded_on: z.string().trim().max(20).nullable().optional(),
  address_street: z.string().trim().max(160).default(""),
  address_number: z.string().trim().max(20).default(""),
  address_complement: z.string().trim().max(80).default(""),
  address_district: z.string().trim().max(80).default(""),
  address_city: z.string().trim().max(80).default(""),
  address_state: z.string().trim().max(40).default(""),
  address_zip: z.string().trim().max(20).default(""),
  address_country: z.string().trim().max(60).default("Brasil"),
  email: z.string().trim().max(255).default(""),
  phone: z.string().trim().min(1, "Telefone obrigatório.").max(40).refine(isValidPhone, PHONE_ERROR),
  website: z.string().trim().max(200).default(""),
  logo_url: z.string().max(1_400_000).nullable().optional(),
  partners: z
    .array(
      z.object({
        name: z.string().trim().max(160),
        cpf: z.string().trim().max(20),
        share: z.string().trim().max(20),
      }),
    )
    .max(30)
    .default([]),
});