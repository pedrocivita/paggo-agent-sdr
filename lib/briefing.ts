// The briefing: the contract between the research agent, the voice agent and
// the panel. Every fact carries its source and how sure we are about it.

import { z } from "zod";

const Fact = z.object({
  value: z.string().describe("O fato em uma frase curta. Use 'não encontrado' quando não souber."),
  source: z.string().nullable().describe("URL de onde o fato saiu, ou null se não houver fonte."),
  confidence: z.enum(["alta", "media", "baixa"]),
});

export const BriefingSchema = z.object({
  company: z.object({
    legalName: Fact,
    cnpj: Fact,
    segment: Fact,
    size: Fact,
    taxRegime: Fact,
    groupEntities: Fact.describe("Outras empresas do grupo, SPEs, filiais."),
    location: Fact,
  }),
  person: z.object({
    role: Fact.describe("Cargo do lead na empresa."),
    isPartner: Fact.describe("Se o lead aparece no quadro de sócios."),
  }),
  fit: z.object({
    level: z.enum(["alto", "medio", "baixo", "desconhecido"]),
    reasons: z.array(z.string()),
  }),
  spicedHypotheses: z.object({
    situation: Fact,
    pain: Fact,
    impact: Fact,
    criticalEvent: Fact,
    decision: Fact,
  }),
  openQuestions: z.array(z.string()).describe("O que a conversa precisa descobrir, em ordem de importância."),
  forAgent: z
    .string()
    .describe("Até 8 linhas em português para o agente de voz: o que já se sabe, o que confirmar e um gancho de abertura."),
});

export type Briefing = z.infer<typeof BriefingSchema>;
export type FactValue = z.infer<typeof Fact>;
