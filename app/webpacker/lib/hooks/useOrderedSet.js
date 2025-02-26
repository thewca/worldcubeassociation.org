import { useCallback, useReducer } from 'react';
import _ from 'lodash';

const reducer = (state, {
  type, array, elements,
}) => {
  const toAdd = _.uniq(elements?.filter((e) => !state.array.includes(e)) ?? []);
  const toRemove = _.uniq(elements?.filter((e) => state.array.includes(e)) ?? []);

  switch (type) {
    case 'clear':
      return { ...state, array: [] };

    case 'override':
      return { ...state, array };

    case 'add':
      if (toAdd.length) {
        return { ...state, array: [...state.array, ...toAdd] };
      }
      break;

    case 'remove':
      if (toRemove.length) {
        return { ...state, array: [...state.array.filter((e) => !toRemove.includes(e))] };
      }
      break;

    case 'toggle':
      if (elements?.length) {
        return {
          ...state,
          array: [...state.array.filter((e) => !toRemove.includes(e)), ...toAdd],
        };
      }
      break;

    default:
      console.error('Unknown action type', type);
      break;
  }

  return state;
};

/** Maintains an ordered set as an array without duplicates. */
export default function useOrderedSet(initialArray = []) {
  const [{ array }, dispatch] = useReducer(
    reducer,
    initialArray,
    (arr) => ({ array: _.uniq(arr) }),
  );

  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const update = useCallback((newArray) => dispatch({ type: 'override', array: newArray }), []);

  const add = useCallback((...elements) => dispatch({ type: 'add', elements }), []);

  const remove = useCallback((...elements) => dispatch({ type: 'remove', elements }), []);

  const toggle = useCallback((...elements) => dispatch({ type: 'toggle', elements }), []);

  const size = array.length;

  const has = useCallback((element) => array.includes(element), [array]);

  return {
    asArray: array, size, has, clear, update, add, remove, toggle,
  };
}
