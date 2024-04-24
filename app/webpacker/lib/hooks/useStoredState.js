import { useState } from 'react';

/**
 * This functions like the useState hook, but it fetches the state stored in
 * local storage, via the given key, on subsequent uses.
 *
 * Do NOT call this twice with the same key - updating one of such a pair
 * will not update the other's state.
 *
 * Currently only works for strings, but can be generalized with JSON.parse
 * and JSON.stringify if needed.
 */
export default function useStoredState(initialState, key) {
  const storedState = localStorage.getItem(key);

  const [state, setState] = useState(() => {
    if (storedState === null) {
      localStorage.setItem(key, initialState);
      return initialState;
    }
    return storedState;
  });

  function setAndStoreState(newState) {
    setState(newState);
    localStorage.setItem(key, newState);
  }

  return [state, setAndStoreState];
}
