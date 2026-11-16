import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import LegacyHashRedirect from "./LegacyHashRedirect";

const replace = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const tabs = [{ id: 12, name: "Travel info" }];

const redirectTargetFor = (hash: string) => {
  window.location.hash = hash;
  render(<LegacyHashRedirect competitionId="Foo2026" tabs={tabs} />);

  return replace.mock.calls[0]?.[0];
};

describe("LegacyHashRedirect", () => {
  afterEach(() => replace.mockClear());

  it("forwards the Rails events tab", () => {
    expect(redirectTargetFor("#competition-events")).toBe(
      "/competitions/Foo2026/events",
    );
  });

  it("forwards the Rails schedule tab", () => {
    expect(redirectTargetFor("#competition-schedule")).toBe(
      "/competitions/Foo2026/schedule",
    );
  });

  it("forwards a custom tab by the id in its Rails slug", () => {
    expect(redirectTargetFor("#12-travel-info")).toBe(
      "/competitions/Foo2026/custom-tabs/Travel%20info",
    );
  });

  it("stays on the page for an unknown hash", () => {
    expect(redirectTargetFor("#99-deleted-tab")).toBeUndefined();
  });
});
