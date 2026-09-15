import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * The hook writes to Weblate and Weblate's translations write back to Payload,
 * so the two guards below are what stop that being a loop: a write in a target
 * locale must not sync, and a burst of edits must produce one run, not one per
 * document.
 */
const runSync = vi.fn(() => Promise.resolve());
vi.mock("./sync", () => ({ runSync: () => runSync() }));
vi.mock("./weblate", () => ({ weblateConfigured: true }));

const { weblateAfterChange } = await import("./hooks");

// Only `req.locale` and `req.payload.logger` are read.
const req = (locale?: string) =>
  ({ req: { locale, payload: { logger: { error: vi.fn() } } } }) as never;

describe("weblateAfterChange", () => {
  beforeEach(() => runSync.mockClear());

  it("syncs a source-locale write", () => {
    weblateAfterChange(req("en"));
    expect(runSync).toHaveBeenCalledTimes(1);
  });

  it("ignores a write-back in a target locale", () => {
    weblateAfterChange(req("de"));
    expect(runSync).not.toHaveBeenCalled();
  });

  it("collapses a burst into one run", async () => {
    let release!: () => void;
    runSync.mockImplementationOnce(
      () => new Promise<void>((resolve) => (release = resolve)),
    );

    weblateAfterChange(req("en"));
    weblateAfterChange(req("en"));
    weblateAfterChange(req("en"));
    expect(runSync).toHaveBeenCalledTimes(1);

    release();
    await vi.waitFor(() => {
      weblateAfterChange(req("en"));
      expect(runSync).toHaveBeenCalledTimes(2);
    });
  });
});
