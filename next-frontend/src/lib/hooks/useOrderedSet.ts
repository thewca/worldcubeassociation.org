import { useCallback, useReducer } from "react";
import _ from "lodash";

export interface OrderedSet<T> {
  asArray: T[];
  size: number;
  has: (element: T) => boolean;
  clear: () => void;
  update: (elements: T[]) => void;
  add: (...elements: T[]) => void;
  remove: (...elements: T[]) => void;
  toggle: (...elements: T[]) => void;
}

interface ReducerState<T> {
  array: T[];
}

interface ReducerAction<T> {
  type: "clear" | "override" | "add" | "remove" | "toggle";
  array?: T[];
}

const reducer = <T>(
  state: ReducerState<T>,
  { type, array = [] }: ReducerAction<T>,
): ReducerState<T> => {
  const uniqueChanges = _.uniq(array);
  const [toRemove, toAdd] = _.partition(uniqueChanges, (e) =>
    state.array.includes(e),
  );

  switch (type) {
    case "clear":
      return { ...state, array: [] };

    case "override":
      return { ...state, array };

    case "add":
      if (toAdd.length > 0) {
        return { ...state, array: [...state.array, ...toAdd] };
      }
      break;

    case "remove":
      if (toRemove.length) {
        return {
          ...state,
          array: [...state.array.filter((e) => !toRemove.includes(e))],
        };
      }
      break;

    case "toggle":
      if (array.length) {
        return {
          ...state,
          array: [
            ...state.array.filter((e) => !toRemove.includes(e)),
            ...toAdd,
          ],
        };
      }
      break;

    default:
      console.error("Unknown action type", type);
      break;
  }

  return state;
};

function useOrderedSetInternal<T>(
  array: T[],
  dispatch: (action: ReducerAction<T>) => void,
): OrderedSet<T> {
  const clear = useCallback(() => dispatch({ type: "clear" }), [dispatch]);

  const update = useCallback(
    (newArray: T[]) => dispatch({ type: "override", array: newArray }),
    [dispatch],
  );

  const add = useCallback(
    (...elements: T[]) => dispatch({ type: "add", array: elements }),
    [dispatch],
  );

  const remove = useCallback(
    (...elements: T[]) => dispatch({ type: "remove", array: elements }),
    [dispatch],
  );

  const toggle = useCallback(
    (...elements: T[]) => dispatch({ type: "toggle", array: elements }),
    [dispatch],
  );

  const size = array.length;

  const has = useCallback((element: T) => array.includes(element), [array]);

  return {
    asArray: array,
    size,
    has,
    clear,
    update,
    add,
    remove,
    toggle,
  };
}

/** Maintains an ordered set as an array without duplicates. */
export default function useOrderedSet<T>(
  initialArray: T[] = [],
): OrderedSet<T> {
  const [{ array }, dispatch] = useReducer(reducer<T>, initialArray, (arr) => ({
    array: _.uniq(arr),
  }));

  return useOrderedSetInternal<T>(array, dispatch);
}

export const useOrderedSetWrapper = <T>(
  arrayState: T[],
  setArrayState: (updater: (array: T[]) => T[]) => ReducerState<T>,
  referenceSet?: T[],
) => {
  const dispatchExternal = useCallback(
    (action: ReducerAction<T>) =>
      setArrayState((array) => {
        const { array: nextState } = reducer({ array }, action);

        if (referenceSet) {
          // cheap way of sorting `nextState` by the order of elements determined in `referenceSet`,
          return _.intersection(referenceSet, nextState);
        }

        return nextState;
      }),
    [setArrayState, referenceSet],
  );

  return useOrderedSetInternal(arrayState, dispatchExternal);
};
