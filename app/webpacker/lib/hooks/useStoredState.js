import { useState } from 'react';

/**
 * This functions like the useState hook, but it fetches the state stored in
 * local storage, via the given key, on subsequent uses.
 *
 * Do NOT call this twice with the same key - updating one of such a pair
 * will not update the other's state.
 */
export default function useStoredState(initialState, key) {
  let storedState;
  try {
    storedState = JSON.parse(localStorage.getItem(key));
  } catch {
    storedState = null;
  }

  const [state, setState] = useState(() => {
    if (storedState === null) {
      localStorage.setItem(key, JSON.stringify(initialState));
      return initialState;
    }
    return storedState;
  });

  function setAndStoreState(newState) {
    setState(newState);
    localStorage.setItem(key, JSON.stringify(newState));
  }

  return [state, setAndStoreState];
}
