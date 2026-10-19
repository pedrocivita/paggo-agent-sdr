// Where a lead came from: the campaign tags of the landing URL (utm_*) and the site that sent the
// visitor. It serves Paggo's marketing and CRM; the research and the voice never see it.

export const ORIGIN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "referrer"] as const;
export type LeadOrigin = Partial<Record<(typeof ORIGIN_KEYS)[number], string>>;

/** The origin fields that came filled, each cut to 300 characters; undefined when none did. */
export function readOrigin(get: (key: string) => string): LeadOrigin | undefined {
  const filled = ORIGIN_KEYS.map((key) => [key, get(key).slice(0, 300)] as const).filter(([, value]) => value);
  return filled.length ? Object.fromEntries(filled) : undefined;
}

/** One line for the panel, in the fixed order (Postgres reorders jsonb keys): "utm_source: linkedin, referrer: ...". */
export function describeOrigin(origin?: LeadOrigin): string {
  const parts = ORIGIN_KEYS.filter((key) => origin?.[key]).map((key) => `${key}: ${origin?.[key]}`);
  return parts.length ? parts.join(", ") : "·";
}
