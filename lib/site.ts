// Reads a company's own website (home and contact pages) and pulls out the
// text and any CNPJ written there, usually in the footer.

import { findCnpjs } from "./cnpj";

const PERSONAL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "msn.com",
  "yahoo.com", "yahoo.com.br", "icloud.com", "me.com", "uol.com.br", "bol.com.br",
  "terra.com.br", "ig.com.br", "proton.me", "protonmail.com",
]);

const PATHS = ["", "/contato", "/fale-conosco", "/sobre", "/quem-somos"];
const MAX_PAGES = 3;
const TIMEOUT_MS = 6000;
const MAX_TEXT = 6000;
const HOSTNAME = /^(?=.{4,253}$)([a-z0-9-]+\.)+[a-z]{2,}$/;

export function isPersonalDomain(domain: string): boolean {
  return PERSONAL_DOMAINS.has(domain);
}

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export type SitePage = { url: string; text: string };
export type SiteResult = { domain: string; pages: SitePage[]; cnpjs: string[] };
type Page = SitePage & { cnpjs: string[] };

async function getPage(url: string): Promise<Page | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "Mozilla/5.0 (compatible; PaggoResearchBot/1.0)" },
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;
    const text = htmlToText(await res.text());
    // The CNPJ usually sits in the footer, past the text the agent gets: search the whole page.
    return { url: res.url, text: text.slice(0, MAX_TEXT), cnpjs: findCnpjs(text) };
  } catch {
    return null;
  }
}

export async function readSite(domain: string): Promise<SiteResult> {
  const host = domain.toLowerCase().replace(/^www\./, "");
  if (!HOSTNAME.test(host) || isPersonalDomain(host)) {
    throw new Error(`Domínio sem site da empresa: ${domain}`);
  }

  const pages: Page[] = [];
  for (const path of PATHS) {
    if (pages.length >= MAX_PAGES) break;
    const page = (await getPage(`https://${host}${path}`)) ?? (path === "" ? await getPage(`https://www.${host}`) : null);
    if (page && !pages.some((p) => p.url === page.url)) pages.push(page);
  }

  const cnpjs = [...new Set(pages.flatMap((p) => p.cnpjs))];
  return { domain: host, pages: pages.map(({ url, text }) => ({ url, text })), cnpjs };
}
