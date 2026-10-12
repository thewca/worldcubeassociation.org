import { describe, expect, it } from "vitest";
import { teamDisplayAbbreviation } from "@/lib/wca/roles/teamDisplayAbbreviation";

describe("teamDisplayAbbreviation", () => {
  it("uses WAC for the Appeals Committee", () => {
    expect(teamDisplayAbbreviation("wapc")).toBe("WAC");
  });

  it("uppercases other friendly IDs", () => {
    expect(teamDisplayAbbreviation("wst")).toBe("WST");
  });
});
