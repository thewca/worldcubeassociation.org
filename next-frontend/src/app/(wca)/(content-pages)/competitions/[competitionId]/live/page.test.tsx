import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement } from "react";
import LiveOverview from "./page";
import LiveLayout from "./layout";

const { getCompetitionInfo, getRounds, getSchedule, getPermissions } =
  vi.hoisted(() => ({
    getCompetitionInfo: vi.fn(),
    getRounds: vi.fn(),
    getSchedule: vi.fn(),
    getPermissions: vi.fn(),
  }));

vi.mock("@/lib/wca/competitions/getCompetitionInfo", () => ({
  getCompetitionInfo,
}));
vi.mock("@/lib/wca/live/getRounds", () => ({ getRounds }));
vi.mock("@/lib/wca/competitions/getSchedule", () => ({ getSchedule }));
vi.mock("@/lib/wca/permissions.server", () => ({ default: getPermissions }));
vi.mock("@/lib/i18n/get18n", () => ({ getT: async () => ({ t: vi.fn() }) }));
vi.mock("@/components/ui/openapiError", () => ({ default: () => null }));
vi.mock("@/components/competitions/LiveTabs", () => ({ default: () => null }));
vi.mock("@/providers/RoundInfoProvider", () => ({
  RoundsInfoProvider: () => null,
}));
vi.mock("@/components/competitions/Schedule/LiveView", () => ({
  default: () => null,
}));

const params = Promise.resolve({ competitionId: "KentFall2026" });

function mockCompetition(
  scoretaking_software: "wca_live" | "external" | "internal",
) {
  getCompetitionInfo.mockResolvedValue({
    data: { id: "KentFall2026", name: "Kent Fall 2026", scoretaking_software },
  });
}

describe("live results provider routing", () => {
  beforeEach(() => vi.resetAllMocks());

  it("shows the canonical WCA Live destination without requesting internal live data", async () => {
    mockCompetition("wca_live");
    expect(await LiveLayout({ params, children: "external page" })).toBe(
      "external page",
    );
    const page = await LiveOverview({ params });
    expect(page.props.externalHref).toBe(
      "https://live.worldcubeassociation.org/link/competitions/KentFall2026",
    );
    expect(getRounds).not.toHaveBeenCalled();
    expect(getSchedule).not.toHaveBeenCalled();
    expect(getPermissions).not.toHaveBeenCalled();
  });

  it("handles other external software without inventing a results destination", async () => {
    mockCompetition("external");
    expect(await LiveLayout({ params, children: "external page" })).toBe(
      "external page",
    );
    const page = await LiveOverview({ params });
    expect(page.props.externalHref).toBeUndefined();
    expect(page.props.competitionInfo.id).toBe("KentFall2026");
    expect(getRounds).not.toHaveBeenCalled();
    expect(getSchedule).not.toHaveBeenCalled();
  });

  it("still loads rounds and the schedule for internal scoretaking", async () => {
    mockCompetition("internal");
    getRounds.mockResolvedValue({ data: { rounds: [] } });
    getSchedule.mockResolvedValue({ data: { venues: [] } });
    getPermissions.mockResolvedValue(undefined);
    await LiveLayout({ params, children: "internal page" });
    await LiveOverview({ params });
    expect(getRounds).toHaveBeenCalledExactlyOnceWith("KentFall2026");
    expect(getSchedule).toHaveBeenCalledExactlyOnceWith("KentFall2026");
    expect(getPermissions).toHaveBeenCalledOnce();
  });

  it("keeps competition lookup errors out of the external results flow", async () => {
    getCompetitionInfo.mockResolvedValue({
      error: {},
      response: new Response(null, { status: 404 }),
    });
    const layout = await LiveLayout({ params, children: "external page" });
    const page = await LiveOverview({ params });
    expect(layout).not.toBe("external page");
    expect(page.props.response.status).toBe(404);
    expect(getRounds).not.toHaveBeenCalled();
    expect(getSchedule).not.toHaveBeenCalled();
  });

  it("preserves errors from the internal rounds API", async () => {
    mockCompetition("internal");
    getRounds.mockResolvedValue({
      error: {},
      response: new Response(null, { status: 500 }),
    });
    const layout = await LiveLayout({ params, children: "internal page" });
    if (!isValidElement<{ response: Response }>(layout)) {
      throw new Error("Expected an API error element");
    }
    expect(layout.props.response.status).toBe(500);
  });
});
