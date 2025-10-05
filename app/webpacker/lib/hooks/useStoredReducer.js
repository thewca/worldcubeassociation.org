import { useReducer } from 'react';
import { getJsonItem, setJsonItem } from '../utils/localStorage';

/**
 * This functions like the useReducer hook, but it fetches the state stored in
 * local storage, via the given key, on subsequent uses.
 *
 * Do NOT call this twice with the same key - updating one of such a pair
 * will not update the other's state.
 */
export default function useStoredReducer(reducer, initialState, key) {
  function augmentedReducer(state, action) {
    const newState = reducer(state, action);
    setJsonItem(key, newState);
    return newState;
  }

  const [state, dispatch] = useReducer(augmentedReducer, initialState, (value) => {
    const storedState = getJsonItem(key);

    if (storedState === null) {
      setJsonItem(key, value);
      return value;
    }
    return storedState;
  });

  return [state, dispatch];
}
