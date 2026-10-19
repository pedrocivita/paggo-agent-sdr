// The role options of Paggo's own contact form (paggo.com.br/contato) and the
// buying-committee persona each one maps to, so the voice and the panel speak
// the same language as Paggo's sales team.
export const ROLES = {
  financeiro: { label: "Responsável pela área financeira (CFO, Diretor, Sócio)", persona: "Decisor Financeiro" },
  controller: { label: "Controller ou Gestor de Contratos", persona: "Influenciador Técnico" },
  analista: { label: "Analista ou Coordenador Financeiro", persona: "Usuário Principal" },
  ceo: { label: "CEO ou Responsável Geral da Empresa", persona: "Decisor Não-Financeiro" },
  outro: { label: "Outro", persona: "Outro" },
} as const;

export type Role = keyof typeof ROLES;

export const isRole = (value: string): value is Role => Object.hasOwn(ROLES, value);

// "Analista ou Coordenador Financeiro; papel na compra: Usuário Principal", or a fallback for older leads.
export function describeRole(role: string | undefined): string {
  if (!role || !isRole(role)) return "não informado";
  const { label, persona } = ROLES[role];
  return persona === "Outro" ? label : `${label}; papel na compra: ${persona}`;
}
