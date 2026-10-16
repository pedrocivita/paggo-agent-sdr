// Web search through Exa. Returns the page text along with each result, so
// the agent does not need a separate "fetch page" tool.

const EXA_URL = "https://api.exa.ai/search";
const TIMEOUT_MS = 12000;

export type SearchResult = { title: string; url: string; text: string };

export async function searchWeb(query: string, numResults = 5): Promise<SearchResult[]> {
  const key = process.env.EXA_API_KEY;
  if (!key) throw new Error("Busca web indisponível: EXA_API_KEY não configurada");

  const res = await fetch(EXA_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key },
    body: JSON.stringify({ query, numResults, contents: { text: { maxCharacters: 1500 } } }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Busca web falhou: HTTP ${res.status}`);

  const data = (await res.json()) as { results?: { title?: string; url: string; text?: string }[] };
  return (data.results ?? []).map((r) => ({ title: r.title ?? "", url: r.url, text: r.text ?? "" }));
}
