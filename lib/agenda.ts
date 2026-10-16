// The meeting calendar served by Paggo. Without AGENDA_URL it falls back to a
// fake calendar with the same contract, so the whole flow runs before the
// real credentials arrive.

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
      const url = `${baseUrl}/agenda/disponibilidade?de=${encodeURIComponent(from)}&ate=${encodeURIComponent(to)}`;
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`Agenda respondeu HTTP ${res.status}`);
      const data = (await res.json()) as { livres?: Slot[] };
      return data.livres ?? [];
    },
    async book(booking) {
      const res = await fetch(`${baseUrl}/agenda/reunioes`, {
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

export function agenda(): Agenda {
  const { AGENDA_URL, AGENDA_TOKEN } = process.env;
  return AGENDA_URL && AGENDA_TOKEN ? realAgenda(AGENDA_URL.replace(/\/$/, ""), AGENDA_TOKEN) : fakeAgenda();
}
