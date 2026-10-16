import { defineTool } from "eve/tools";
import { z } from "zod";
import { searchWeb } from "../../lib/search";
import { traced } from "../../lib/trace";

export default defineTool({
  description:
    "Busca na web e devolve título, URL e o texto de cada página. Use para o que o site e a Receita não responderam.",
  inputSchema: z.object({ query: z.string().describe("A busca, em português") }),
  async execute({ query }, ctx) {
    return traced({ kind: "research", id: ctx.session.id }, "web_search", { query }, () => searchWeb(query));
  },
});
