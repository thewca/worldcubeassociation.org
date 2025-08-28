import { useState } from 'react';
import { getJsonItem } from '../utils/localStorage';

/**
 * This functions like the useState hook, but it fetches the state stored in
 * local storage, via the given key, on subsequent uses.
 *
 * Do NOT call this twice with the same key - updating one of such a pair
 * will not update the other's state.
 */
export default function useStoredState(initialState, key) {
  const [state, setState] = useState(() => {
    const storedState = getJsonItem(key);

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
