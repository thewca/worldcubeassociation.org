import { useState, useCallback } from 'react';

// /!\ This can only be used with react-semantic-ui toggle buttons /!\
// All the react-semantic-ui buttons expect an 'onChange' handler with the signature:
// onChange(event: ChangeEvent, data: object)
// It's tempting to use 'event.target.value', which works in most cases
// but when toggling buttons, we simply want to flip the previous state around.
// This is a small wrapper to automatically create the appropriate callback
// and avoid rendering the button at each render.
// If 'data' is undefined, we consider it's a regular "setState" call and set
// the value from the first param.
const useToggleState = (defaultVal = undefined) => {
  const [state, setState] = useState(defaultVal);
  const updateFromOnChange = useCallback((ev, data = undefined) => {
    if (data) {
      setState(!data.active);
    } else {
      setState(ev);
    }
  }, [setState]);
  return [state, updateFromOnChange];
};

export default useToggleState;
