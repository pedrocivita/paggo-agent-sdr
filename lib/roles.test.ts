import { describe, expect, it } from "vitest";
import { describeRole, isRole } from "./roles";

describe("describeRole", () => {
  it("gives the label and the buying-committee persona", () => {
    expect(describeRole("analista")).toBe("Analista ou Coordenador Financeiro; papel na compra: Usuário Principal");
  });

  it("gives only the label for Outro", () => {
    expect(describeRole("outro")).toBe("Outro");
  });

  it("falls back for leads from before the field and for unknown values", () => {
    expect(describeRole(undefined)).toBe("não informado");
    expect(describeRole("toString")).toBe("não informado");
    expect(isRole("toString")).toBe(false);
  });
});
