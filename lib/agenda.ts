// The meeting calendar served by Paggo. AGENDA_URL is the base Paggo gives
// (".../agenda"), with /disponibilidade and /reunioes under it. Without it the
// fake calendar answers with the same contract.

export type Slot = { inicio: string; fim: string };
export type Booking = { inicio: string; nome: string; email: string };
export type BookResult = { ok: true } | { ok: false; conflict: true };

export interface Agenda {
  available(from: string, to: string): Promise<Slot[]>;
  book(booking: Booking): Promise<BookResult>;
}

function realAgenda(baseUrl: string, token: string): Agenda {
  const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  return {
    async available(from, to) {
      const url = `${baseUrl}/disponibilidade?de=${encodeURIComponent(from)}&ate=${encodeURIComponent(to)}`;
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`Agenda respondeu HTTP ${res.status}`);
      const data = (await res.json()) as { livres?: Slot[] };
      return data.livres ?? [];
    },
    async book(booking) {
      const res = await fetch(`${baseUrl}/reunioes`, {
        method: "POST",
        headers,
        body: JSON.stringify(booking),
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 409) return { ok: false, conflict: true };
      if (!res.ok) throw new Error(`Agenda respondeu HTTP ${res.status}`);
      return { ok: true };
    },
  };
}

// Business days from tomorrow, three 30-minute slots each, in São Paulo time.
function fakeAgenda(): Agenda {
  const booked = new Set<string>();
  return {
    async available(from, to) {
      const slots: Slot[] = [];
      const day = new Date(`${from.slice(0, 10)}T12:00:00-03:00`);
      const end = new Date(`${to.slice(0, 10)}T12:00:00-03:00`);
      for (; day <= end; day.setDate(day.getDate() + 1)) {
        if (day.getDay() === 0 || day.getDay() === 6) continue;
        const date = day.toISOString().slice(0, 10);
        for (const [start, finish] of [["10:00", "10:30"], ["14:00", "14:30"], ["16:30", "17:00"]]) {
          const inicio = `${date}T${start}:00-03:00`;
          if (!booked.has(inicio)) slots.push({ inicio, fim: `${date}T${finish}:00-03:00` });
        }
      }
      return slots;
    },
    async book(booking) {
      if (booked.has(booking.inicio)) return { ok: false, conflict: true };
      booked.add(booking.inicio);
      return { ok: true };
    },
  };
}

const TZ = "America/Sao_Paulo";

function spDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** From now to the end of the 5th business day ahead, in São Paulo time: the window the voice agent offers. */
export function searchWindow(now: Date, businessDays = 5): { from: string; to: string } {
  const day = new Date(`${spDate(now)}T12:00:00-03:00`);
  let counted = 0;
  while (counted < businessDays) {
    day.setUTCDate(day.getUTCDate() + 1);
    if (day.getUTCDay() !== 0 && day.getUTCDay() !== 6) counted++;
  }
  return { from: now.toISOString(), to: `${spDate(day)}T23:59:59-03:00` };
}

/**
 * The slots the voice agent may offer: per business day, the first two of the morning and the first
 * two of the afternoon, none starting before `earliest`. The agent picks another day or period from
 * this same list, so it never has to make up a time (it did once, when only the first four came back).
 */
export function pickOptions(slots: Slot[], earliest: number, perPeriod = 2): Slot[] {
  const taken = new Map<string, number>();
  return slots
    .filter((s) => Date.parse(s.inicio) >= earliest)
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio))
    .filter((s) => {
      const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(new Date(s.inicio)));
      const key = `${spDate(new Date(s.inicio))}-${hour < 12 ? "manha" : "tarde"}`;
      const count = taken.get(key) ?? 0;
      taken.set(key, count + 1);
      return count < perPeriod;
    });
}

/**
 * Whether `inicio` is one of the free slots. The booking route checks it so the agent can only book a
 * real, free slot of the window, never one it made up (it did, once in production and once in a run).
 */
export function isFreeSlot(free: Slot[], inicio: string): boolean {
  const at = Date.parse(inicio);
  return !Number.isNaN(at) && free.some((s) => Date.parse(s.inicio) === at);
}

/** A slot as the agent says it out loud: "terça-feira, dia 20, às 10h". */
export function spokenSlot(inicio: string): string {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ, weekday: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(inicio));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const minutes = get("minute") === "00" ? "" : get("minute");
  return `${get("weekday")}, dia ${get("day")}, às ${Number(get("hour"))}h${minutes}`;
}

export function agenda(): Agenda {
  const { AGENDA_URL, AGENDA_TOKEN } = process.env;
  return AGENDA_URL && AGENDA_TOKEN ? realAgenda(AGENDA_URL.replace(/\/$/, ""), AGENDA_TOKEN) : fakeAgenda();
}
