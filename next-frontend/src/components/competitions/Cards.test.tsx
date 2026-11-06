import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { createInstance } from "i18next";
import { InfoCard, RegistrationCard } from "./Cards";
import OrganizationTeamCard from "./OrganizerCard";
import type { components } from "@/types/openapi";
import translations from "@/lib/i18n/locales/en.json";

const i18n = createInstance();

vi.mock("@/lib/i18n/get18n", () => ({
  getT: async () => ({ t: i18n.t }),
}));

vi.mock("@/lib/i18n/useI18n", () => ({
  useT: () => ({ t: i18n.t }),
}));

vi.mock("@/components/competitions/BookmarkButton", () => ({
  default: () => <button>Bookmark this competition</button>,
}));

vi.mock("@/components/LocalDateTime", () => ({
  default: ({ isoDateTime }: { isoDateTime: string }) => isoDateTime,
}));

const person = (id: number): components["schemas"]["Person"] => ({
  id,
  name: "Competition staff",
  wca_id: "2005EXAM01",
  country_iso2: "US",
  delegate_status: "delegate",
  teams: [],
  url: "https://www.worldcubeassociation.org/persons/2005EXAM01",
  avatar: { url: "https://example.com/avatar.png", is_default: true },
});

const competitionInfo: components["schemas"]["CompetitionInfo"] = {
  id: "KentFall2026",
  name: "Kent Fall 2026",
  information: "Competition information",
  venue: "[Kent Commons](https://example.com/venue)",
  venue_address: "525 4th Ave N, Kent, WA 98030",
  venue_details: "**Gym**",
  contact: "https://example.com/contact",
  registration_open: "2026-08-07T00:00:00Z",
  registration_close: "2026-10-31T00:00:00Z",
  use_wca_registration: true,
  guests_enabled: false,
  announced_at: "2026-07-01T00:00:00Z",
  results_posted_at: null,
  base_entry_fee_lowest_denomination: 3000,
  currency_code: "USD",
  start_date: "2026-11-07",
  end_date: "2026-11-07",
  enable_donations: false,
  competitor_limit: 160,
  on_the_spot_registration: false,
  refund_policy_percent: 75,
  refund_policy_limit_date: "2026-10-31T00:00:00Z",
  guests_entry_fee_lowest_denomination: 0,
  qualification_results: false,
  event_restrictions: false,
  waiting_list_deadline_date: "2026-10-31T00:00:00Z",
  event_change_deadline_date: "2026-10-31T00:00:00Z",
  competitor_can_cancel: "not_accepted",
  scoretaking_software: "wca_live",
  url: "https://www.worldcubeassociation.org/competitions/KentFall2026",
  website: "https://www.worldcubeassociation.org/competitions/KentFall2026",
  city: "Kent, Washington",
  latitude_degrees: 47.386,
  longitude_degrees: -122.238,
  country_iso2: "US",
  event_ids: ["333"],
  main_event_id: "333",
  number_of_bookmarks: 40,
  "uses_qualification?": false,
  "using_payment_integrations?": true,
  "part_of_competition_series?": false,
  "registration_full?": true,
  "registration_full_and_accepted?": false,
  // Paid pending registrations reserve the other three places.
  spots_left: 0,
  accepted_registration_count: 157,
  waiting_list_count: 7,
  tab_names: [],
  delegates: [person(267)],
  organizers: [person(8184)],
};

beforeAll(async () => {
  await i18n.init({
    lng: "en",
    keySeparator: false,
    pluralSeparator: ".",
    resources: { en: { translation: translations } },
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const renderInfoCard = (userId?: number, venueDetails = "**Gym**") =>
  render(
    <ChakraProvider value={defaultSystem}>
      <InfoCard
        competitionInfo={{ ...competitionInfo, venue_details: venueDetails }}
        userId={userId}
        bookmark={{ bookmarked: false }}
        t={i18n.t}
      />
    </ChakraProvider>,
  );

const renderRegistrationCard = async (
  overrides: Partial<components["schemas"]["CompetitionInfo"]> = {},
) => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-05T12:00:00Z"));
  const card = await RegistrationCard({
    competitionInfo: { ...competitionInfo, ...overrides },
  });
  return render(<ChakraProvider value={defaultSystem}>{card}</ChakraProvider>);
};

describe("InfoCard", () => {
  it.each([undefined, 9999])(
    "hides the bookmark count for viewer %s",
    (userId) => {
      renderInfoCard(userId);

      expect(screen.queryByText("bookmarks")).toBeNull();
      expect(
        screen.getByRole("button", { name: "Bookmark this competition" }),
      ).toBeVisible();
    },
  );

  it.each([8184, 267])(
    "shows the bookmark count for competition staff %s",
    (userId) => {
      renderInfoCard(userId);

      expect(screen.getByText("bookmarks").parentElement).toHaveTextContent(
        "40",
      );
    },
  );

  it("shows the venue, address and Markdown details in the title card", () => {
    renderInfoCard();

    expect(screen.getByRole("link", { name: "Kent Commons" })).toHaveAttribute(
      "href",
      "https://example.com/venue",
    );
    expect(screen.getByText(competitionInfo.venue_address)).toBeVisible();
    expect(screen.getByText("Gym").tagName).toBe("STRONG");
    expect(screen.queryByText("Competitor Limit")).toBeNull();
  });

  it("omits empty venue details", () => {
    renderInfoCard(undefined, "");

    expect(screen.queryByText("Details")).toBeNull();
  });
});

describe("RegistrationCard", () => {
  it("shows accepted competitors and the limit after registration closes", async () => {
    await renderRegistrationCard();

    expect(screen.getByText("Competitors").parentElement).toHaveTextContent(
      "157 / 160",
    );
  });

  it("excludes paid pending registrations while registration is open", async () => {
    await renderRegistrationCard({
      registration_close: "2026-11-06T00:00:00Z",
    });

    expect(screen.getByText("Competitors").parentElement).toHaveTextContent(
      "157 / 160",
    );
    expect(
      screen.getByText("Waiting list size").parentElement,
    ).toHaveTextContent("7");
  });

  it("shows zero accepted competitors when registration is open", async () => {
    await renderRegistrationCard({
      registration_close: "2026-11-06T00:00:00Z",
      accepted_registration_count: 0,
      spots_left: 160,
      "registration_full?": false,
    });

    expect(screen.getByText("Competitors").parentElement).toHaveTextContent(
      "0 / 160",
    );
  });

  it("shows only the limit before registration opens", async () => {
    await renderRegistrationCard({
      registration_open: "2026-11-06T00:00:00Z",
      registration_close: "2026-11-07T00:00:00Z",
      accepted_registration_count: 0,
      spots_left: 160,
    });

    expect(
      screen.getByText("Competitor limit").parentElement,
    ).toHaveTextContent("160");
    expect(screen.queryByText("Competitors")).toBeNull();
  });

  it("shows only the limit for external registration without imported registrations", async () => {
    await renderRegistrationCard({
      use_wca_registration: false,
      accepted_registration_count: 0,
    });

    expect(
      screen.getByText("Competitor limit").parentElement,
    ).toHaveTextContent("160");
  });

  it("shows imported accepted registrations for external registration", async () => {
    await renderRegistrationCard({ use_wca_registration: false });

    expect(screen.getByText("Competitors").parentElement).toHaveTextContent(
      "157 / 160",
    );
  });

  it("omits the denominator for competitions without a limit", async () => {
    await renderRegistrationCard({ spots_left: null });

    expect(screen.getByText("Competitors").parentElement).toHaveTextContent(
      /^Competitors157$/,
    );
  });
});

describe("OrganizationTeamCard", () => {
  const delegates = [
    { ...person(100), name: "First Delegate" },
    { ...person(200), name: "Second Delegate" },
    { ...person(300), name: "Third Delegate" },
  ];
  const organizers = [
    { ...person(400), name: "First Organizer" },
    { ...person(500), name: "Second Organizer" },
  ];

  it("uses the base card's summaries and more-members controls", () => {
    render(
      <ChakraProvider value={defaultSystem}>
        <OrganizationTeamCard
          competitionInfo={{ ...competitionInfo, delegates, organizers }}
        />
      </ChakraProvider>,
    );

    expect(screen.getByRole("link", { name: "First Delegate" })).toBeVisible();
    expect(screen.getByRole("link", { name: "First Organizer" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "View 2 more team members" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "View 1 more team members" }),
    ).toBeVisible();
  });

  it("shows single-person teams without more-members controls", () => {
    render(
      <ChakraProvider value={defaultSystem}>
        <OrganizationTeamCard
          competitionInfo={{
            ...competitionInfo,
            delegates: [delegates[0]],
            organizers: [organizers[0]],
          }}
        />
      </ChakraProvider>,
    );

    expect(screen.getByRole("link", { name: "First Delegate" })).toBeVisible();
    expect(screen.getByRole("link", { name: "First Organizer" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /more team members/ }),
    ).toBeNull();
  });
});
