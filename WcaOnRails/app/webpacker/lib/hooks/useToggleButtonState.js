import { useState, useCallback } from 'react';

// /!\ This can only be used with react-semantic-ui inputs /!\
// same idea as "useInputState" instead that for checkboxes, you have to call a different value.
const useToggleButtonState = (defaultVal = undefined) => {
  const [state, setState] = useState(defaultVal);
  const updateFromOnChange = useCallback((ev, data = undefined) => {
    if (data) {
      // toggle means when the button was 'on' when the click happened, we need to set it to 'off'.
      setState(!data.active);
    } else {
      setState(ev);
    }
  }, [setState]);
  return [state, updateFromOnChange];
};

export default useToggleButtonState;
