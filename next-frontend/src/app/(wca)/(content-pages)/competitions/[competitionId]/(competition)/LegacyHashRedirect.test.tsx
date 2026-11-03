import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LegacyHashRedirect from "./LegacyHashRedirect";

const tabs = [
  { id: 12, name: "Travel info" },
  { id: 34, name: "</script><script>alert(1)</script>" },
];

const renderedMarkup = renderToStaticMarkup(
  <LegacyHashRedirect competitionId="Foo2026" tabs={tabs} />,
);

const redirectTargetFor = (hash: string) => {
  const replace = vi.fn();
  const script = renderedMarkup.replace(/^<script>|<\/script>$/g, "");

  new Function("window", script)({ location: { hash, replace } });

  return replace.mock.calls[0]?.[0];
};

describe("LegacyHashRedirect", () => {
  it("forwards the Rails events and schedule tabs", () => {
    expect(redirectTargetFor("#competition-events")).toBe(
      "/competitions/Foo2026/events",
    );
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
    expect(redirectTargetFor("#competition-general")).toBeUndefined();
  });

  it("does not let a tab name close the script tag", () => {
    expect(renderedMarkup.match(/<\/script>/g)).toHaveLength(1);
  });
});
