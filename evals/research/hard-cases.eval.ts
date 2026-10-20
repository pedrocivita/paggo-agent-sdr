// The hard research cases of docs/research-cases.md: real companies, fictional people.
// Every run hits the live sites, the Receita and Exa (about US$ 0.40 for the six), so the
// checks are the facts that must hold, not the wording.

import { defineEval, type EveEvalContext } from "eve/evals";
import { includes, matches, satisfies } from "eve/evals/expect";
import { BriefingSchema, type Briefing } from "../../lib/briefing";
import { findCnpjs, normalizeCnpj } from "../../lib/cnpj";
import { researchMessage } from "../../lib/research";

type Case = {
  description: string;
  name: string;
  email: string;
  company: string;
  /** The company's own CNPJ, the first one the briefing must cite; null when it has none. */
  cnpj: string | null;
  fit: Briefing["fit"]["level"];
  /** Builder or developer: the agent must search the group's SPEs. */
  realEstate: boolean;
  /** A realistic name: the agent must search the person. */
  searchPerson?: boolean;
  /** What the lead typed in the free field of the form. */
  formExtra?: string;
  tags?: string[];
  extra?: (t: EveEvalContext, briefing: Briefing) => void;
};

const MAX_MS = 45_000;
// Neither Paggo's deck nor its site says how it charges, so no sentence about price may say what it
// depends on (the briefing once told the voice "o preço depende do número de CNPJs/SPEs e dos módulos",
// and in the eval "o valor depende do tamanho da operação" and "para explicar como o valor se define").
const inventsPrice = (text: string) =>
  text.split(/[.\n]/).some((s) => /pre[cç]o|valor|custo/i.test(s) && /depend|defin|tamanho|n[úu]mero de|mensalidade|cobrad/i.test(s));
// Partners that are companies may be named; people never.
const COMPANY_NAME = /\b(LTDA|S\.?\/?A\.?|EIRELI|PARTICIPA|EMPREENDIMENTO|INCORPORA|CONSTRU|FUNDO|HOLDING)/i;

const cases: Case[] = [
  {
    description: "Developer with many SPEs whose site shows only its brokerage's CNPJ (Even)",
    name: "Renata Moura Teixeira",
    email: "renata.teixeira@even.com.br",
    company: "Even Construtora",
    cnpj: "43470988000165",
    fit: "alto",
    realEstate: true,
    searchPerson: true,
  },
  {
    description: "Homonym: Tenda the builder, not Tenda Atacado; the site blocks bots",
    name: "Bruno Teste",
    email: "bruno.teste@tenda.com",
    company: "Tenda",
    cnpj: "71476527000135",
    fit: "alto",
    realEstate: true,
  },
  {
    description: "Personal e-mail with a real company name (Cury)",
    name: "Juliana Prado Siqueira",
    email: "juliana.prado.fin@gmail.com",
    company: "Cury Construtora",
    cnpj: "08797760000183",
    fit: "alto",
    realEstate: true,
    searchPerson: true,
    extra(t, b) {
      t.notCalledTool("fetch_site");
      t.check(b.company.cnpj.confidence, satisfies<string>((c) => c !== "alta", "no high confidence without a domain"));
    },
  },
  {
    description: "Site without a CNPJ and a common name (Pacaembu, Bauru)",
    name: "Diego Teste",
    email: "diego.teste@pacaembu.com",
    company: "Pacaembu Construtora",
    cnpj: "96298013000168",
    fit: "alto",
    realEstate: true,
    extra(t, b) {
      t.check(b.company.location.value, includes(/Bauru/i)).label("location");
    },
  },
  {
    description: "Foreign company with a Brazilian homonym (Lennar)",
    name: "Emma Teste",
    email: "emma.teste@lennar.com",
    company: "Lennar",
    cnpj: null,
    fit: "baixo",
    realEstate: false,
    extra(t, b) {
      t.check(b.company.cnpj.source, satisfies<string | null>((s) => s === null, "no CNPJ chosen")).label("cnpj");
    },
  },
  {
    description: "Paggo's own team: the site also shows an unrelated MEI",
    name: "Fabio Teste",
    email: "fabio.teste@paggo.com.br",
    company: "Paggo",
    cnpj: "47883739000152",
    fit: "desconhecido",
    realEstate: false,
    extra(t, b) {
      t.check(b.forAgent, includes(/lead normal/i)).label("normal conversation");
    },
  },
  {
    description: "A lead who asks the price in the free field: the briefing must not invent how Paggo charges",
    name: "Fabio Teste",
    email: "fabio.teste@paggo.com.br",
    company: "Paggo",
    cnpj: "47883739000152",
    fit: "desconhecido",
    realEstate: false,
    formExtra: "Quanto custa? Queria saber valores antes de conversar.",
    tags: ["price"],
  },
];

const sameCnpj = (expected: string) => (value: unknown) => normalizeCnpj(String(value)) === expected;

export default cases.map((c) =>
  defineEval({
    description: c.description,
    tags: ["research", "live", ...(c.tags ?? [])],
    async test(t) {
      const form = { name: c.name, email: c.email, phone: "(11) 90000-0000", company: c.company, extra: c.formExtra ?? "" };
      const started = Date.now();
      const turn = await t.send(researchMessage(form), { outputSchema: BriefingSchema });
      const ms = Date.now() - started;
      t.succeeded();
      t.check(ms, satisfies<number>((v) => v < MAX_MS, `briefing under ${MAX_MS / 1000} s`)).label("time");
      const briefing = (await t.require(turn.data, matches(BriefingSchema))) as Briefing;
      const lookups = turn.toolCalls.filter((call) => call.name === "lookup_cnpj");
      t.log(`${c.company}: ${(ms / 1000).toFixed(1)} s, ${turn.toolCalls.length} tool calls`);

      t.check(briefing.fit.level, satisfies<string>((level) => level === c.fit, `fit ${c.fit}`)).label("fit");
      if (c.cnpj) {
        const chosen = findCnpjs(briefing.company.cnpj.value)[0];
        t.check(chosen, satisfies<string | undefined>((v) => v === c.cnpj, `CNPJ ${c.cnpj}`)).label("cnpj");
        t.calledTool("lookup_cnpj", { input: { cnpj: sameCnpj(c.cnpj) } });
      }

      // Every CNPJ cited should come from the Receita; a dropped homonym may only be named.
      const looked = new Set(lookups.map((call) => normalizeCnpj(String(call.input.cnpj))));
      const cited = findCnpjs(JSON.stringify(briefing));
      t.score(cited.length === 0 ? 1 : cited.filter((cnpj) => looked.has(cnpj)).length / cited.length)
        .label("cited CNPJs looked up")
        .atLeast(1);

      const people = lookups
        .flatMap((call) => (call.output as { partners?: { name: string }[] } | undefined)?.partners ?? [])
        .map((p) => p.name.toUpperCase())
        .filter((name) => name && !COMPANY_NAME.test(name));
      const text = JSON.stringify(briefing).toUpperCase();
      t.check(people, satisfies<string[]>((names) => names.every((n) => !text.includes(n)), "no partner names")).label("privacy");

      t.check(briefing.forAgent, includes(/m[óo]dulos? prov[áa]ve/i)).label("module hint");
      t.check(JSON.stringify(briefing), satisfies<string>((s) => !inventsPrice(s), "no pricing rule")).label("no invented price");
      if (c.realEstate) t.calledTool("web_search", { input: { query: /SPE/i } });
      if (c.searchPerson) t.calledTool("web_search", { input: { query: new RegExp(c.name.split(" ")[0]) } });
      c.extra?.(t, briefing);
    },
  }),
);
