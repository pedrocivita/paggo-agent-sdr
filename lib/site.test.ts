import { afterEach, describe, expect, it, vi } from "vitest";
import { readSite } from "./site";

afterEach(() => vi.unstubAllGlobals());

describe("readSite", () => {
  it("finds the footer CNPJ of a long page, past the text the agent gets", async () => {
    // Like cyrela.com.br: the footer CNPJ sits after character 9000.
    const html = `<html><body><main>${"Lançamentos e obras. ".repeat(600)}</main>
      <footer>Exemplo Incorporadora Ltda. CNPJ 11.222.333/0001-81</footer></body></html>`;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const res = new Response(html, { headers: { "content-type": "text/html" } });
        Object.defineProperty(res, "url", { value: url });
        return res;
      }),
    );

    const site = await readSite("exemplo.com.br");

    expect(site.cnpjs).toEqual(["11222333000181"]);
    expect(site.pages[0].text.length).toBeLessThanOrEqual(6000);
  });
});
