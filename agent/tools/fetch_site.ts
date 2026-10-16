import { defineTool } from "eve/tools";
import { z } from "zod";
import { readSite } from "../../lib/site";
import { traced } from "../../lib/trace";

export default defineTool({
  description:
    "Lê a home e as páginas de contato do site da empresa (pelo domínio do e-mail) e devolve o texto e os CNPJs válidos encontrados.",
  inputSchema: z.object({ domain: z.string().describe("Domínio do site, por exemplo exemplo.com.br") }),
  async execute({ domain }, ctx) {
    return traced({ kind: "research", id: ctx.session.id }, "fetch_site", { domain }, () => readSite(domain));
  },
});
