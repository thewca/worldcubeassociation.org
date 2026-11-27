import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { mockAllIsIntersecting } from "react-intersection-observer/test-utils";
import { Provider } from "@/components/ui/provider";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";

vi.mock("@/lib/i18n/useI18n", () => ({
  useT: () => ({ t: (key: string) => key }),
}));

describe("InfiniteScrollSentinel", () => {
  const fetchNextPage = vi.fn();

  beforeEach(() => fetchNextPage.mockClear());

  const scrollToSentinel = (
    props: Partial<Parameters<typeof InfiniteScrollSentinel>[0]>,
  ) => {
    render(
      <Provider>
        <InfiniteScrollSentinel
          hasNextPage
          isFetchingNextPage={false}
          isFetchNextPageError={false}
          fetchNextPage={fetchNextPage}
          {...props}
        />
      </Provider>,
    );
    mockAllIsIntersecting(true);
  };

  it("fetches the next page when scrolled into view", () => {
    scrollToSentinel({});
    expect(fetchNextPage).toHaveBeenCalledOnce();
  });

  it("does not fetch past the last page", () => {
    scrollToSentinel({ hasNextPage: false });
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("does not fetch while a page is already loading", () => {
    scrollToSentinel({ isFetchingNextPage: true });
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("does not repeat a failed request", () => {
    scrollToSentinel({ isFetchNextPageError: true });
    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
