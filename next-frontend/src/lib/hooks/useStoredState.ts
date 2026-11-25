import {
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";

type StoredState<T> = [T, Dispatch<SetStateAction<T>>];

// The native `storage` event only fires in *other* tabs, so the tab that wrote needs its own event.
const STORED_STATE_CHANGE = "stored-state-change";

const subscribe = (onChange: () => void) => {
  window.addEventListener(STORED_STATE_CHANGE, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(STORED_STATE_CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
};

const parseStoredState = <T>(rawState: string | null, initialState: T): T =>
  rawState === null ? initialState : JSON.parse(rawState);

/**
 * This functions like the useState hook, but it keeps the state in local
 * storage under the given key, so that it is still there on subsequent uses.
 *
 * The server can't read local storage, so it always renders the initial state.
 */
export default function useStoredState<T>(
  initialState: T,
  key: string,
): StoredState<T> {
  const rawState = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key),
    () => null,
  );

  const setStoredState: Dispatch<SetStateAction<T>> = (newState) => {
    const resolved =
      newState instanceof Function
        ? newState(parseStoredState(localStorage.getItem(key), initialState))
        : newState;

    localStorage.setItem(key, JSON.stringify(resolved));
    window.dispatchEvent(new Event(STORED_STATE_CHANGE));
  };

  return [parseStoredState(rawState, initialState), setStoredState];
}
