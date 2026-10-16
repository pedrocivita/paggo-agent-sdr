// CNPJ rules and the public Receita lookup.
//
// Since July 2026 the CNPJ is alphanumeric: the first 12 characters accept
// uppercase letters, the last 2 check digits stay numeric. Mod 11 uses the
// ASCII code minus 48 for each character, so plain digits behave as before.

const SHAPE = /^[0-9A-Z]{12}[0-9]{2}$/;
const IN_TEXT = /\b[0-9A-Z]{2}\.?[0-9A-Z]{3}\.?[0-9A-Z]{3}\/?[0-9A-Z]{4}-?[0-9]{2}\b/g;
const WEIGHTS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const WEIGHTS_2 = [6, ...WEIGHTS_1];

// Fixed host: only a validated CNPJ ever enters the URL.
const BRASIL_API = "https://brasilapi.com.br/api/cnpj/v1";
const TIMEOUT_MS = 8000;

export function normalizeCnpj(value: string): string {
  return (value ?? "").replace(/[.\-/\s]/g, "").toUpperCase();
}

function checkDigit(chars: string, weights: number[]): number {
  const sum = [...chars].reduce((acc, c, i) => acc + (c.charCodeAt(0) - 48) * weights[i], 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function isValidCnpj(cnpj: string): boolean {
  if (!SHAPE.test(cnpj) || new Set(cnpj).size === 1) return false;
  const first = checkDigit(cnpj.slice(0, 12), WEIGHTS_1);
  const second = checkDigit(cnpj.slice(0, 12) + first, WEIGHTS_2);
  return cnpj.slice(12) === `${first}${second}`;
}

/** Every valid CNPJ written anywhere in a text, without duplicates. */
export function findCnpjs(text: string): string[] {
  const found = (text.toUpperCase().match(IN_TEXT) ?? []).map(normalizeCnpj);
  return [...new Set(found.filter(isValidCnpj))];
}

/** The public service failed. Different from "this CNPJ does not exist". */
export class ReceitaUnavailable extends Error {}

export type CompanyRecord = {
  cnpj: string;
  legalName: string;
  tradeName: string;
  status: string;
  openedAt: string;
  mainActivity: string;
  size: string;
  shareCapital: number | null;
  simples: boolean;
  latestTaxRegime: { year: number; regime: string } | null;
  city: string;
  state: string;
  partners: { name: string; role: string }[];
  source: string;
};

type BrasilApiCnpj = Record<string, unknown> & {
  qsa?: { nome_socio?: string; qualificacao_socio?: string }[];
  regime_tributario?: { ano?: number; forma_de_tributacao?: string; cnpj_da_scp?: string | null }[];
};

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** MEI legal names end with the owner's CPF; it is personal data and never stored. */
export function withoutCpf(legalName: string): string {
  return legalName.replace(/\s*\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "").trim();
}

function latestTaxRegime(data: BrasilApiCnpj): CompanyRecord["latestTaxRegime"] {
  const own = (data.regime_tributario ?? []).filter((r) => typeof r.ano === "number" && !r.cnpj_da_scp);
  if (own.length === 0) return null;
  const last = own.reduce((a, b) => ((b.ano ?? 0) > (a.ano ?? 0) ? b : a));
  return { year: last.ano!, regime: text(last.forma_de_tributacao) };
}

export async function lookupCnpj(raw: string): Promise<CompanyRecord> {
  const cnpj = normalizeCnpj(raw);
  if (!isValidCnpj(cnpj)) throw new Error("CNPJ inválido: confira os 14 caracteres e os dígitos verificadores");

  const url = `${BRASIL_API}/${cnpj}`;
  let res: Response;
  try {
    // BrasilAPI answers 403 to requests without a user agent.
    res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "PaggoResearchBot/1.0", accept: "application/json" },
    });
  } catch (err) {
    throw new ReceitaUnavailable(String(err));
  }
  if (res.status === 404) throw new Error("CNPJ não encontrado no registro público");
  if (!res.ok) throw new ReceitaUnavailable(`HTTP ${res.status}`);

  const data = (await res.json()) as BrasilApiCnpj;
  return {
    cnpj,
    legalName: withoutCpf(text(data.razao_social)),
    tradeName: text(data.nome_fantasia),
    status: text(data.descricao_situacao_cadastral),
    openedAt: text(data.data_inicio_atividade),
    mainActivity: [data.cnae_fiscal, text(data.cnae_fiscal_descricao)].filter(Boolean).join(" "),
    size: text(data.porte),
    shareCapital: typeof data.capital_social === "number" ? data.capital_social : null,
    simples: Boolean(data.opcao_pelo_simples || data.opcao_pelo_mei),
    latestTaxRegime: latestTaxRegime(data),
    city: text(data.municipio),
    state: text(data.uf),
    partners: (data.qsa ?? []).map((p) => ({ name: text(p.nome_socio), role: text(p.qualificacao_socio) })),
    source: url,
  };
}
