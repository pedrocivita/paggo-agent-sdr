import { describe, expect, it } from "vitest";
import { searchWindow, spokenSlot } from "./agenda";

describe("agenda", () => {
  it("says a slot the way a person would", () => {
    expect(spokenSlot("2026-10-20T10:00:00-03:00")).toBe("terça-feira, dia 20, às 10h");
    expect(spokenSlot("2026-10-21T15:30:00-03:00")).toBe("quarta-feira, dia 21, às 15h30");
  });

  it("looks five business days ahead, skipping the weekend", () => {
    const friday = new Date("2026-10-16T15:00:00-03:00");
    expect(searchWindow(friday).to).toBe("2026-10-23T23:59:59-03:00");
  });

  it("uses São Paulo's date late at night, not UTC's", () => {
    const fridayNight = new Date("2026-10-16T23:30:00-03:00");
    expect(searchWindow(fridayNight).to).toBe("2026-10-23T23:59:59-03:00");
  });
});
