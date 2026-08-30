import { describe, expect, it } from "vitest";
import { normalizeForSearch } from "@/lib/live/normalizeForSearch";

describe("normalizeForSearch", () => {
  it("strips diacritics and lowercases", () => {
    expect(normalizeForSearch("Jérôme LaRochelle")).toBe("jerome larochelle");
  });

  it("makes accented names matchable by unaccented input", () => {
    expect(normalizeForSearch("Jérôme LaRochelle")).toContain(
      normalizeForSearch("Je"),
    );
    expect(normalizeForSearch("Jérôme LaRochelle")).toContain(
      normalizeForSearch("Jé"),
    );
  });

  it("leaves names without diacritics unchanged apart from case", () => {
    expect(normalizeForSearch("Feliks Zemdegs")).toBe("feliks zemdegs");
  });
});
