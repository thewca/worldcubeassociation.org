import { useCallback, useReducer } from 'react';

const reducer = (state, {
  type, array, element,
}) => {
  switch (type) {
    case 'clear':
      return { ...state, array: [] };

    case 'override':
      return { ...state, array };

    case 'add':
      if (!state.array.includes(element)) {
        return { ...state, array: [...state.array, element] };
      }
      break;

    case 'remove':
      if (state.array.includes(element)) {
        return { ...state, array: [...state.array.filter((e) => e !== element)] };
      }
      break;

    case 'toggle':
      if (state.array.includes(element)) {
        return { ...state, array: [...state.array.filter((e) => e !== element)] };
      }
      return { ...state, array: [...state.array, element] };

    default:
      console.error('Unknown action type', type);
      break;
  }

  return state;
};

const removeDuplicates = (array) => [...new Set(array)];

/** Maintains an ordered set as an array without duplicates. */
export default function useOrderedSet(initialArray = []) {
  const [{ array }, dispatch] = useReducer(
    reducer,
    initialArray,
    (arr) => ({ array: removeDuplicates(arr) }),
  );

  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const update = useCallback((newArray) => dispatch({ type: 'override', array: newArray }), []);

  const add = useCallback((element) => dispatch({ type: 'add', element }), []);

  const remove = useCallback((element) => dispatch({ type: 'remove', element }), []);

  const toggle = useCallback((element) => dispatch({ type: 'toggle', element }), []);

  return {
    asArray: array, clear, update, add, remove, toggle,
  };
}
