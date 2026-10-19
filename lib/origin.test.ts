import { describe, expect, it } from "vitest";
import { describeOrigin, readOrigin } from "./origin";

describe("origin", () => {
  it("keeps only the filled fields, cut to 300 characters", () => {
    const form: Record<string, string> = {
      utm_source: "linkedin",
      utm_medium: "",
      utm_campaign: "x".repeat(400),
      referrer: "https://www.linkedin.com/",
    };
    expect(readOrigin((key) => form[key] ?? "")).toEqual({
      utm_source: "linkedin",
      utm_campaign: "x".repeat(300),
      referrer: "https://www.linkedin.com/",
    });
  });

  it("is undefined when nothing came", () => {
    expect(readOrigin(() => "")).toBeUndefined();
  });

  it("reads as one line in the panel", () => {
    expect(describeOrigin({ referrer: "https://www.linkedin.com/", utm_source: "linkedin" })).toBe(
      "utm_source: linkedin, referrer: https://www.linkedin.com/",
    );
    expect(describeOrigin(undefined)).toBe("·");
  });
});
