import { useState, useCallback } from 'react';

export const useCheckboxUpdater = (setState) => (
  useCallback((ev, data = undefined) => {
    if (data) {
      setState(data.checked);
    } else {
      setState(ev);
    }
  }, [setState])
);

// /!\ This can only be used with react-semantic-ui inputs /!\
// same idea as "useInputState" instead that for checkboxes, you have to call a different value.
const useCheckboxState = (defaultVal = undefined) => {
  const [state, setState] = useState(defaultVal);
  const updateFromOnChange = useCheckboxUpdater(setState);

  return [state, updateFromOnChange];
};

export default useCheckboxState;
