import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import i18next from "i18next";
import translations from "@/lib/i18n/locales/en.json";
import ExternalLiveResults from "./ExternalLiveResults";

vi.mock("@/lib/i18n/useI18n", () => ({ useT: () => ({ t: i18next.t }) }));

await i18next.init({
  lng: "en",
  resources: { en: { translation: translations } },
  keySeparator: false,
  interpolation: { prefix: "%{", suffix: "}" },
});

const destination =
  "https://live.worldcubeassociation.org/link/competitions/KentFall2026";
const competitionInfo = { id: "KentFall2026", name: "Kent Fall 2026" };
const replace = vi.fn();

function renderNotice(externalHref?: string) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <ExternalLiveResults
        competitionInfo={competitionInfo}
        externalHref={externalHref}
      />
    </ChakraProvider>,
  );
}

describe("ExternalLiveResults", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("location", { replace });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    replace.mockClear();
  });

  it("offers a link and replaces the page only after five seconds", () => {
    renderNotice(destination);
    expect(screen.getByText("Live results for Kent Fall 2026")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "View live results" }),
    ).toHaveAttribute("href", destination);
    expect(
      screen.getByText("You will be redirected automatically in 5 seconds."),
    ).toBeVisible();
    act(() => vi.advanceTimersByTime(4999));
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(replace).toHaveBeenCalledExactlyOnceWith(destination);
  });

  it("cancels automatic navigation when the user follows the link", () => {
    renderNotice(destination);
    const link = screen.getByRole("link", { name: "View live results" });
    const click = createEvent.click(link);
    click.preventDefault();
    fireEvent(link, click);
    act(() => vi.advanceTimersByTime(5000));
    expect(replace).not.toHaveBeenCalled();
    expect(
      screen.queryByText(/redirected automatically/),
    ).not.toBeInTheDocument();
  });

  it("cancels navigation when leaving the page", () => {
    const { unmount } = renderNotice(destination);
    unmount();
    act(() => vi.advanceTimersByTime(5000));
    expect(replace).not.toHaveBeenCalled();
  });

  it("links to competition information without redirecting when the provider URL is unknown", () => {
    renderNotice();
    expect(
      screen.getByText(
        /This competition is using external scoretaking software/,
      ),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Information" })).toHaveAttribute(
      "href",
      "/competitions/KentFall2026",
    );
    act(() => vi.advanceTimersByTime(5000));
    expect(replace).not.toHaveBeenCalled();
    expect(
      screen.queryByText(/redirected automatically/),
    ).not.toBeInTheDocument();
  });
});
