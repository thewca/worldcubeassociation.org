import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import EventDropdown from "@/components/EventDropdown";
import { Provider } from "@/components/ui/provider";

// JSDOM has no layout observer; the menu uses one to position its popup.
beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterAll(() => vi.unstubAllGlobals());

vi.mock("@/lib/i18n/useI18n", () => ({
  useT: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "results.selector_elements.events_selector.event": "Event",
        "competitions.index.all_events": "All",
        "events.333": "3x3x3 Cube",
        "events.222": "2x2x2 Cube",
        "events.333ft": "3x3x3 With Feet",
      };
      return translations[key] ?? key;
    },
  }),
}));

function renderDropdown(
  props: Partial<ComponentProps<typeof EventDropdown>> = {},
) {
  const onValueChange = vi.fn();
  render(
    <Provider>
      <EventDropdown value="333" onValueChange={onValueChange} {...props} />
    </Provider>,
  );
  return onValueChange;
}

describe("EventDropdown", () => {
  it("limits choices to the supplied events, including retired events", async () => {
    const onValueChange = renderDropdown({ eventIds: ["333", "333ft"] });
    fireEvent.click(screen.getByRole("button", { name: "Event: 3x3x3 Cube" }));

    const retiredEvent = await screen.findByRole("menuitemradio", {
      name: "3x3x3 With Feet",
    });
    expect(screen.getAllByRole("menuitemradio")).toHaveLength(2);
    expect(
      screen.getByRole("menuitemradio", { name: "3x3x3 Cube" }),
    ).toHaveAttribute("aria-checked", "true");

    fireEvent.click(retiredEvent);
    await waitFor(() =>
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith("333ft"),
    );
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("keeps the selected event when it is chosen again", async () => {
    const onValueChange = renderDropdown();
    fireEvent.click(screen.getByRole("button", { name: "Event: 3x3x3 Cube" }));
    fireEvent.click(
      await screen.findByRole("menuitemradio", { name: "3x3x3 Cube" }),
    );

    await waitFor(() =>
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith("333"),
    );
  });

  it.each(["all events", ""])(
    "returns the caller's all-events value %j",
    async (allEventsValue) => {
      const onValueChange = renderDropdown({ allEventsValue });
      fireEvent.click(
        screen.getByRole("button", { name: "Event: 3x3x3 Cube" }),
      );
      fireEvent.click(
        await screen.findByRole("menuitemradio", { name: "All" }),
      );

      await waitFor(() =>
        expect(onValueChange).toHaveBeenCalledExactlyOnceWith(allEventsValue),
      );
    },
  );

  it.each([{ disabled: true }, { eventIds: [] }])(
    "prevents opening when unavailable: %j",
    (props) => {
      renderDropdown(props);
      expect(screen.getByRole("button")).toBeDisabled();
    },
  );
});
