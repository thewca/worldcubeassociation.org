import { useCallback } from 'react';
import _ from 'lodash';

// This aims to provide a quick wrapper to:
//   - create an updater for a given path in a state created by useState or similar.
//   - take into account how react-semantic-ui provides the input value through its
//   onChange method, which must have this signature:
//   onChange(event: ChangeEvent, data: object)
// Example usage:
// const setMyProp = useNestedInputUpdater(setGlobalState, 'myProp');
//
// It can be used directly like any other set method:
// setMyProp('my val');
// Or passed as the 'onChange' callback of a react-semantic-ui input.

const useNestedInputUpdater = (updater, path) => useCallback((ev, data = undefined) => {
  const value = data ? data.value : ev;
  // updater is assumed to come from useState or similar, so we can pass it a
  // function that act based on the previous state.
  updater((prevState) => {
    // This is a react state, we can't just modify something in prevValue,
    // we need to create a brand new copy.
    const newState = { ...prevState };
    _.set(newState, path, value);
    return newState;
  });
}, [updater, path]);

export default useNestedInputUpdater;
