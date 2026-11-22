import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18next from "i18next";
import TabCompetitors from "./TabCompetitors";
import type { components, paths } from "@/types/openapi";

const { fetchAPI } = vi.hoisted(() => ({ fetchAPI: vi.fn<typeof fetch>() }));

vi.mock("@/lib/wca/useAPI", async () => {
  const { default: createClient } = await import("openapi-fetch");
  const { default: createQueryClient } = await import("openapi-react-query");
  const api = createQueryClient(
    createClient<paths>({ baseUrl: "https://wca.test/api", fetch: fetchAPI }),
  );
  return { default: () => api };
});

vi.mock("@/lib/i18n/useI18n", () => ({
  useT: () => ({ t: i18next.t }),
}));

// Keep the event selector independent of the icon pack and translation provider.
vi.mock("@/components/EventSelector", () => ({
  FormEventSelector: ({
    onEventClick,
  }: {
    onEventClick: (eventId: string) => void;
  }) => (
    <>
      <button onClick={() => onEventClick("333")}>3x3x3</button>
      <button onClick={() => onEventClick("333mbf")}>Multi-blind</button>
    </>
  ),
}));
vi.mock("@/components/competitions/CompetitorTable", () => ({
  default: () => null,
}));
vi.mock("@/components/WcaFlag", () => ({ default: () => null }));
vi.mock("@/components/CountryMap", () => ({ default: () => null }));

function sheetFor(url: URL): components["schemas"]["PsychSheet"] {
  const recent = url.searchParams.get("ranking_period") === "last_12_months";
  const multiBlind = url.pathname.endsWith("333mbf");
  const single =
    (url.searchParams.get("sort_by") ?? (multiBlind ? "single" : "average")) ===
    "single";
  const bobLeads = recent && (!single || multiBlind);
  const alice = {
    name: "Alice",
    user_id: 1,
    wca_id: null,
    country_iso2: "SE",
    single_best: multiBlind
      ? recent
        ? 950012000
        : 880024000
      : recent
        ? 700
        : 100,
    average_best: multiBlind ? 0 : recent ? 1100 : 200,
    single_rank: recent ? null : 11,
    average_rank: recent ? null : 12,
    pos: multiBlind && !single ? null : bobLeads ? 2 : 1,
    tied_previous: false,
  };
  const bob = {
    name: "Bob",
    user_id: 2,
    wca_id: null,
    country_iso2: "SE",
    single_best: multiBlind ? 900024000 : recent ? 800 : 300,
    average_best: multiBlind ? 0 : recent ? 1000 : 400,
    single_rank: recent ? null : 21,
    average_rank: recent ? null : 22,
    pos: multiBlind && !single ? null : bobLeads ? 1 : 2,
    tied_previous: false,
  };
  const inactive = {
    name: "Inactive",
    user_id: 3,
    wca_id: null,
    country_iso2: "SE",
    single_best: recent ? 0 : multiBlind ? 970006000 : 500,
    average_best: recent || multiBlind ? 0 : 600,
    single_rank: recent ? null : 31,
    average_rank: recent ? null : 32,
    pos: recent ? null : 3,
    tied_previous: null,
  };
  return {
    sort_by: single ? "single" : "average",
    sort_by_second: single ? "average" : "single",
    sorted_rankings: bobLeads ? [bob, alice, inactive] : [alice, bob, inactive],
  };
}

function requestUrl(input: Parameters<typeof fetch>[0]) {
  return new URL(input instanceof Request ? input.url : input.toString());
}

function renderCompetitors() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <ChakraProvider value={defaultSystem}>
      <QueryClientProvider client={queryClient}>
        <TabCompetitors id="Test2026" eventIds={["333", "333mbf"]} />
      </QueryClientProvider>
    </ChakraProvider>,
  );
}

beforeEach(async () => {
  await i18next.init({
    lng: "en",
    keySeparator: false,
    resources: {
      en: {
        translation: {
          "competitions.registration_v2.list.psychsheets.position": "Pos",
          "competitions.registration_v2.list.psychsheets.position_last_12_months":
            "Pos (12 months)",
        },
      },
    },
  });
  fetchAPI.mockReset();
  fetchAPI.mockImplementation(async (input) => {
    const url = requestUrl(input);
    return Response.json(
      url.pathname.endsWith("registrations") ? [] : sheetFor(url),
    );
  });
});

function rowValues(name: string) {
  return within(screen.getByRole("row", { name: new RegExp(name) }))
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
}

function orderedNames() {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[2].textContent);
}

describe("competitor position comparison", () => {
  it("adds one position column and keeps all existing columns and values unchanged when sorting", async () => {
    renderCompetitors();
    fireEvent.click(await screen.findByRole("button", { name: "3x3x3" }));
    await screen.findByText("Alice");
    expect(orderedNames()).toEqual(["Alice", "Bob", "Inactive"]);
    expect(rowValues("Alice").slice(0, 2)).toEqual(["1", "2"]);
    expect(rowValues("Bob").slice(0, 2)).toEqual(["2", "1"]);
    expect(rowValues("Inactive").slice(0, 2)).toEqual(["3", "—"]);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(8);
    expect(screen.getAllByRole("columnheader", { name: "WR" })).toHaveLength(2);
    const aliceValues = rowValues("Alice");
    const bobValues = rowValues("Bob");
    const inactiveValues = rowValues("Inactive");

    fireEvent.click(
      screen.getByRole("button", { name: "Pos (12 months)", exact: true }),
    );
    expect(orderedNames()).toEqual(["Bob", "Alice", "Inactive"]);
    expect(rowValues("Alice")).toEqual(aliceValues);
    expect(rowValues("Bob")).toEqual(bobValues);
    expect(rowValues("Inactive")).toEqual(inactiveValues);
    expect(screen.getAllByRole("columnheader")).toHaveLength(8);
    expect(screen.getAllByRole("columnheader", { name: "WR" })).toHaveLength(2);
    expect(screen.getByText("1.00")).toBeInTheDocument();
    expect(screen.getByText("3.00")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pos", exact: true }));
    expect(orderedNames()).toEqual(["Alice", "Bob", "Inactive"]);
    expect(rowValues("Alice")).toEqual(aliceValues);
  });

  it("keeps all-time results usable while the recent positions load", async () => {
    const pendingResponse = Promise.withResolvers<Response>();
    fetchAPI.mockImplementation((input) => {
      const url = requestUrl(input);
      return url.searchParams.get("ranking_period") === "last_12_months"
        ? pendingResponse.promise
        : Promise.resolve(
            Response.json(
              url.pathname.endsWith("registrations") ? [] : sheetFor(url),
            ),
          );
    });
    renderCompetitors();
    fireEvent.click(await screen.findByRole("button", { name: "3x3x3" }));
    await waitFor(() =>
      expect(
        fetchAPI.mock.calls.some(
          ([input]) =>
            requestUrl(input).searchParams.get("ranking_period") ===
            "last_12_months",
        ),
      ).toBe(true),
    );
    await screen.findByText("Alice");
    expect(rowValues("Alice").slice(0, 2)).toEqual(["1", ""]);
    expect(screen.getByText("1.00")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Pos (12 months)", exact: true }),
    ).toBeDisabled();
    pendingResponse.resolve(
      Response.json(
        sheetFor(new URL("https://wca.test/333?ranking_period=last_12_months")),
      ),
    );
    await waitFor(() =>
      expect(rowValues("Alice").slice(0, 2)).toEqual(["1", "2"]),
    );
    expect(
      screen.getByRole("button", { name: "Pos (12 months)", exact: true }),
    ).toBeEnabled();
  });

  it("preserves the selected position sort when changing result type or event", async () => {
    renderCompetitors();
    fireEvent.click(await screen.findByRole("button", { name: "3x3x3" }));
    await screen.findByText("Alice");
    fireEvent.click(
      screen.getByRole("button", { name: "Pos (12 months)", exact: true }),
    );
    fireEvent.click(screen.getByRole("columnheader", { name: "Single" }));
    await waitFor(() =>
      expect(
        screen.getByRole("columnheader", { name: "Single" }),
      ).toHaveAttribute("aria-sort", "ascending"),
    );
    expect(orderedNames()).toEqual(["Alice", "Bob", "Inactive"]);
    expect(rowValues("Alice").slice(0, 2)).toEqual(["1", "1"]);
    expect(
      screen.getByRole("columnheader", {
        name: "Pos (12 months)",
        exact: true,
      }),
    ).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByText("1.00")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Multi-blind" }));
    await screen.findByText(/11\/11/);
    expect(orderedNames()).toEqual(["Bob", "Alice", "Inactive"]);
    expect(rowValues("Alice").slice(0, 2)).toEqual(["1", "2"]);
    expect(
      screen.queryByRole("columnheader", { name: "Average" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "WR" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(6);
    expect(
      screen.getByRole("columnheader", {
        name: "Pos (12 months)",
        exact: true,
      }),
    ).toHaveAttribute("aria-sort", "ascending");
  });

  it("keeps the existing table available if recent positions cannot load", async () => {
    fetchAPI.mockImplementation(async (input) => {
      const url = requestUrl(input);
      if (url.searchParams.get("ranking_period") === "last_12_months")
        return Response.json({ error: "Unavailable" }, { status: 500 });
      return Response.json(
        url.pathname.endsWith("registrations") ? [] : sheetFor(url),
      );
    });
    renderCompetitors();
    fireEvent.click(await screen.findByRole("button", { name: "3x3x3" }));

    expect(
      await screen.findByText(
        "competitions.registration_v2.list.psychsheets.recent_rankings_unavailable",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("1.00")).toBeInTheDocument();
    expect(rowValues("Alice").slice(0, 2)).toEqual(["1", ""]);
    expect(
      screen.getByRole("button", { name: "Pos (12 months)", exact: true }),
    ).toBeDisabled();
    expect(screen.getAllByRole("columnheader")).toHaveLength(8);
  });

  it("restores the event's default result type after explicitly selecting Average", async () => {
    renderCompetitors();
    fireEvent.click(await screen.findByRole("button", { name: "3x3x3" }));
    await screen.findByText("Alice");
    fireEvent.click(
      screen.getByRole("button", { name: "Pos (12 months)", exact: true }),
    );
    fireEvent.click(screen.getByRole("columnheader", { name: "Average" }));
    await waitFor(() =>
      expect(
        fetchAPI.mock.calls.some(
          ([input]) =>
            requestUrl(input).searchParams.get("sort_by") === "average",
        ),
      ).toBe(true),
    );

    fireEvent.click(screen.getByRole("button", { name: "Multi-blind" }));
    await screen.findByText(/11\/11/);
    expect(
      screen.getByRole("columnheader", { name: "Single" }),
    ).toHaveAttribute("aria-sort", "ascending");
    expect(rowValues("Bob").slice(0, 2)).toEqual(["2", "1"]);
    expect(
      screen.getByRole("columnheader", {
        name: "Pos (12 months)",
        exact: true,
      }),
    ).toHaveAttribute("aria-sort", "ascending");
    const multiBlindRequests = fetchAPI.mock.calls
      .map(([input]) => requestUrl(input))
      .filter((url) => url.pathname.endsWith("333mbf"));
    expect(multiBlindRequests).toHaveLength(2);
    expect(
      multiBlindRequests.every((url) => !url.searchParams.has("sort_by")),
    ).toBe(true);
  });

  it("retains the existing error state when the all-time request fails", async () => {
    fetchAPI.mockImplementation(async (input) => {
      const url = requestUrl(input);
      if (url.searchParams.get("ranking_period") === "all_time")
        return Response.json({ error: "Unavailable" }, { status: 500 });
      return Response.json(
        url.pathname.endsWith("registrations") ? [] : sheetFor(url),
      );
    });
    renderCompetitors();
    fireEvent.click(await screen.findByRole("button", { name: "3x3x3" }));
    expect(
      await screen.findByText("competitions.registration_v2.errors.-1001"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders an empty event without inventing positions", async () => {
    fetchAPI.mockImplementation(async (input) => {
      const url = requestUrl(input);
      return Response.json(
        url.pathname.endsWith("registrations")
          ? []
          : {
              ...sheetFor(url),
              sorted_rankings: [],
            },
      );
    });
    renderCompetitors();
    fireEvent.click(await screen.findByRole("button", { name: "3x3x3" }));
    expect(
      await screen.findByText("competitions.registration_v2.list.empty"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(8);
    expect(screen.getByRole("cell")).toHaveAttribute("colspan", "8");
  });

  it("keeps a competitor's lifetime values when their registration is absent from the recent response", async () => {
    fetchAPI.mockImplementation(async (input) => {
      const url = requestUrl(input);
      if (url.pathname.endsWith("registrations")) return Response.json([]);
      const sheet = sheetFor(url);
      return Response.json(
        url.searchParams.get("ranking_period") === "last_12_months"
          ? {
              ...sheet,
              sorted_rankings: sheet.sorted_rankings.filter(
                (row) => row.name !== "Bob",
              ),
            }
          : sheet,
      );
    });
    renderCompetitors();
    fireEvent.click(await screen.findByRole("button", { name: "3x3x3" }));
    await screen.findByText("Bob");
    const bobValues = rowValues("Bob");
    expect(bobValues.slice(0, 2)).toEqual(["2", "—"]);
    fireEvent.click(
      screen.getByRole("button", { name: "Pos (12 months)", exact: true }),
    );
    expect(orderedNames()).toEqual(["Alice", "Inactive", "Bob"]);
    expect(rowValues("Bob")).toEqual(bobValues);
  });
});
