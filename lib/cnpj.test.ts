import { describe, expect, it } from "vitest";
import { findCnpjs, isValidCnpj, normalizeCnpj, withoutCpf } from "./cnpj";

describe("CNPJ", () => {
  it("accepts a numeric CNPJ with correct check digits", () => {
    expect(isValidCnpj(normalizeCnpj("11.222.333/0001-81"))).toBe(true);
  });

  it("accepts the alphanumeric CNPJ (valid since July 2026)", () => {
    expect(isValidCnpj(normalizeCnpj("12.ABC.345/01DE-35"))).toBe(true);
  });

  it("rejects wrong check digits and repeated characters", () => {
    expect(isValidCnpj("11222333000180")).toBe(false);
    expect(isValidCnpj("00000000000000")).toBe(false);
  });

  it("finds CNPJs written in a page footer", () => {
    const footer = "Exemplo Incorporadora Ltda. CNPJ 11.222.333/0001-81. Todos os direitos reservados.";
    expect(findCnpjs(footer)).toEqual(["11222333000181"]);
  });

  it("drops the CPF that MEI legal names carry", () => {
    expect(withoutCpf("MARIA DA SILVA 12345678901")).toBe("MARIA DA SILVA");
    expect(withoutCpf("PAGGO TECNOLOGIA LTDA")).toBe("PAGGO TECNOLOGIA LTDA");
  });

  it("ignores numbers that only look like a CNPJ", () => {
    expect(findCnpjs("Pedido 11.222.333/0001-80 e telefone 11 99999-0000")).toEqual([]);
  });
});
