import { defineTool } from "eve/tools";
import { z } from "zod";
import { lookupCnpj } from "../../lib/cnpj";
import { traced } from "../../lib/trace";

export default defineTool({
  description:
    "Consulta o CNPJ no registro público da Receita (BrasilAPI): razão social, situação, CNAE, porte, capital, regime tributário, Simples e sócios.",
  inputSchema: z.object({ cnpj: z.string().describe("CNPJ com ou sem pontuação") }),
  async execute({ cnpj }, ctx) {
    return traced({ kind: "research", id: ctx.session.id }, "lookup_cnpj", { cnpj }, () => lookupCnpj(cnpj));
  },
});
