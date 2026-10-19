import { describe, expect, it } from "vitest";
import { pickOptions, searchWindow, spokenSlot } from "./agenda";

describe("agenda", () => {
  it("says a slot the way a person would", () => {
    expect(spokenSlot("2026-10-20T10:00:00-03:00")).toBe("terça-feira, dia 20, às 10h");
    expect(spokenSlot("2026-10-21T15:30:00-03:00")).toBe("quarta-feira, dia 21, às 15h30");
  });

  it("looks five business days ahead, skipping the weekend", () => {
    const friday = new Date("2026-10-16T15:00:00-03:00");
    expect(searchWindow(friday).to).toBe("2026-10-23T23:59:59-03:00");
  });

  it("offers two morning and two afternoon slots per day, after the earliest allowed time", () => {
    const slot = (inicio: string) => ({ inicio, fim: inicio });
    const slots = ["09:00", "09:30", "10:00", "13:00", "13:30", "14:00", "17:00"].flatMap((t) => [
      slot(`2026-10-20T${t}:00-03:00`),
      slot(`2026-10-21T${t}:00-03:00`),
    ]);
    const earliest = Date.parse("2026-10-20T09:15:00-03:00");
    expect(pickOptions(slots, earliest).map((s) => s.inicio.slice(5, 16))).toEqual([
      "10-20T09:30", "10-20T10:00", "10-20T13:00", "10-20T13:30",
      "10-21T09:00", "10-21T09:30", "10-21T13:00", "10-21T13:30",
    ]);
  });

  it("uses São Paulo's date late at night, not UTC's", () => {
    const fridayNight = new Date("2026-10-16T23:30:00-03:00");
    expect(searchWindow(fridayNight).to).toBe("2026-10-23T23:59:59-03:00");
  });
});
