import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import BulkQuitButton from "./BulkQuitButton";
import { LiveAttempt, LiveCompetitor, LiveResult } from "@/types/live";
import { LiveResultsByRegistrationId } from "@/providers/LiveResultProvider";

const mutate = vi.fn();

const liveResultsContext: {
  liveResultsByRegistrationId: LiveResultsByRegistrationId;
  competitors: Map<number, LiveCompetitor>;
  pendingLiveResults: [];
} = {
  liveResultsByRegistrationId: {},
  competitors: new Map(),
  pendingLiveResults: [],
};

const resultsAdminContext = {
  batchAttemptsByRegistrationId: new Map<number, LiveAttempt[]>(),
};

vi.mock("@/providers/LiveResultProvider", () => ({
  useLiveResults: () => liveResultsContext,
}));

vi.mock("@/providers/LiveResultAdminProvider", () => ({
  useResultsAdmin: () => resultsAdminContext,
}));

vi.mock("@/lib/wca/useAPI", () => ({
  default: () => ({ useMutation: () => ({ mutate, isPending: false }) }),
}));

vi.mock("@/lib/i18n/useI18n", () => ({
  useT: () => ({ t: (key: string) => key }),
}));

const makeCompetitor = (
  id: number,
  registrantId: number,
  name: string,
): LiveCompetitor => ({
  id,
  registrant_id: registrantId,
  user_id: id,
  name,
  country_iso2: "DE",
  wca_id: null,
});

const makeResult = (
  registrationId: number,
  attemptCount: number,
): LiveResult => ({
  registration_id: registrationId,
  best: 0,
  average: 0,
  single_record_tag: null,
  average_record_tag: null,
  advancing: false,
  advancing_questionable: false,
  attempts: Array.from({ length: attemptCount }, (_, i) => ({
    attempt_number: i + 1,
    value: 1000,
  })),
  last_attempt_entered_at: "2026-11-08T10:00:00.000Z",
  global_pos: null,
  local_pos: null,
  round_wcif_id: "333-r1",
});

const competitors = [
  makeCompetitor(101, 3, "Charlie"),
  makeCompetitor(102, 1, "bob"),
  makeCompetitor(103, 2, "Alice"),
  makeCompetitor(104, 4, "Dana"),
  makeCompetitor(105, 5, "Eve"),
];

const openDialog = async () => {
  render(
    <ChakraProvider value={defaultSystem}>
      <BulkQuitButton competitionId="Foo2026" roundId="333-r1" />
    </ChakraProvider>,
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "competitions.live.admin.quit.bulk.menu",
    }),
  );
  await screen.findByRole("table");
};

const displayedNames = () =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[2].textContent);

const checkboxFor = (name: string) => screen.getByRole("checkbox", { name });

const selectAllCheckbox = () =>
  checkboxFor("competitions.live.admin.quit.bulk.select_all");

describe("BulkQuitButton", () => {
  beforeEach(() => {
    mutate.mockClear();
    liveResultsContext.competitors = new Map(competitors.map((c) => [c.id, c]));
    liveResultsContext.liveResultsByRegistrationId = {
      "101": [makeResult(101, 0)],
      "102": [makeResult(102, 0)],
      "103": [makeResult(103, 0)],
      // Dana already has an attempt, so she can't be bulk quit.
      "104": [makeResult(104, 1)],
      "105": [makeResult(105, 0)],
    };
    // Eve has attempts waiting in the admin batch, so she can't be bulk quit either.
    resultsAdminContext.batchAttemptsByRegistrationId = new Map([
      [105, [{ attempt_number: 1, value: 1000 }]],
    ]);
  });

  it("is disabled when every competitor has results", () => {
    liveResultsContext.liveResultsByRegistrationId = {
      "101": [makeResult(101, 1)],
    };

    render(
      <ChakraProvider value={defaultSystem}>
        <BulkQuitButton competitionId="Foo2026" roundId="333-r1" />
      </ChakraProvider>,
    );

    expect(
      screen.getByRole("button", {
        name: "competitions.live.admin.quit.bulk.menu",
      }),
    ).toBeDisabled();
  });

  it("lists only competitors without results, ordered by registrant ID", async () => {
    await openDialog();

    expect(displayedNames()).toEqual(["bob", "Alice", "Charlie"]);
  });

  it("sorts by name ignoring case, and reverses on a second click", async () => {
    await openDialog();
    const nameHeader = screen.getByRole("columnheader", {
      name: "competitions.live.admin.quit.bulk.name",
    });

    fireEvent.click(nameHeader);
    expect(displayedNames()).toEqual(["Alice", "bob", "Charlie"]);
    expect(nameHeader).toHaveAttribute("aria-sort", "ascending");

    fireEvent.click(nameHeader);
    expect(displayedNames()).toEqual(["Charlie", "bob", "Alice"]);
    expect(nameHeader).toHaveAttribute("aria-sort", "descending");
  });

  it("sorts by registrant ID descending on a click, and back to ascending on a second click", async () => {
    await openDialog();
    const idHeader = screen.getByRole("columnheader", {
      name: "competitions.live.admin.quit.bulk.id",
    });

    expect(idHeader).toHaveAttribute("aria-sort", "ascending");

    fireEvent.click(idHeader);
    expect(displayedNames()).toEqual(["Charlie", "Alice", "bob"]);
    expect(idHeader).toHaveAttribute("aria-sort", "descending");

    fireEvent.click(idHeader);
    expect(displayedNames()).toEqual(["bob", "Alice", "Charlie"]);
    expect(idHeader).toHaveAttribute("aria-sort", "ascending");
  });

  it("starts with everyone selected and toggles all from the header", async () => {
    await openDialog();

    expect(selectAllCheckbox()).toBeChecked();

    fireEvent.click(selectAllCheckbox());
    await waitFor(() => expect(checkboxFor("Alice")).not.toBeChecked());
    expect(selectAllCheckbox()).not.toBeChecked();

    fireEvent.click(selectAllCheckbox());
    await waitFor(() => expect(checkboxFor("Alice")).toBeChecked());
  });

  it("shows a partial selection and only quits the selected competitors", async () => {
    await openDialog();

    fireEvent.click(checkboxFor("Alice"));
    await waitFor(() => expect(selectAllCheckbox()).toBePartiallyChecked());

    fireEvent.click(
      screen.getByRole("button", {
        name: "competitions.live.admin.quit.quit_confirm",
      }),
    );

    const quitRegistrationIds = mutate.mock.calls[0][0].body.registration_ids;
    expect(quitRegistrationIds.toSorted()).toEqual([101, 102]);

    await waitFor(() =>
      expect(screen.queryByRole("table")).not.toBeInTheDocument(),
    );
  });
});
