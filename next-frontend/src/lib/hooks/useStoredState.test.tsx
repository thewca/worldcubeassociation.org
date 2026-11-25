import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useStoredState from "./useStoredState";

const KEY = "scheduleView";

function ActiveView() {
  const [activeView] = useStoredState("calendar", KEY);

  return <p>{activeView}</p>;
}

describe("useStoredState", () => {
  beforeEach(() => localStorage.clear());

  it("renders the initial state on the server, where there is no local storage", () => {
    vi.stubGlobal("localStorage", undefined);

    expect(renderToString(<ActiveView />)).toBe("<p>calendar</p>");

    vi.unstubAllGlobals();
  });

  it("starts with the initial state when nothing is stored", () => {
    const { result } = renderHook(() => useStoredState("calendar", KEY));

    expect(result.current[0]).toBe("calendar");
  });

  it("starts with the stored state", () => {
    localStorage.setItem(KEY, JSON.stringify("table"));

    const { result } = renderHook(() => useStoredState("calendar", KEY));

    expect(result.current[0]).toBe("table");
  });

  it("picks up changes made in other tabs", () => {
    const { result } = renderHook(() => useStoredState("calendar", KEY));

    act(() => {
      localStorage.setItem(KEY, JSON.stringify("table"));
      window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
    });

    expect(result.current[0]).toBe("table");
  });

  it("updates and stores the state", () => {
    const { result } = renderHook(() => useStoredState("calendar", KEY));

    act(() => result.current[1]("table"));

    expect(result.current[0]).toBe("table");
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify("table"));
  });

  it("applies consecutive functional updates on top of each other", () => {
    const { result } = renderHook(() => useStoredState<number[]>([], KEY));

    act(() => {
      result.current[1]((prev) => [...prev, 100]);
      result.current[1]((prev) => [...prev, 200]);
    });

    expect(result.current[0]).toEqual([100, 200]);
  });
});
