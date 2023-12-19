import { useState, useCallback } from 'react';

// /!\ This can only be used with react-semantic-ui inputs /!\
// same idea as "useInputState" instead that for checkboxes, you have to call a different value.
const useCheckboxState = (defaultVal = undefined) => {
  const [state, setState] = useState(defaultVal);
  const updateFromOnChange = useCallback((ev, data = undefined) => {
    if (data) {
      setState(data.checked);
    } else {
      setState(ev);
    }
  }, [setState]);
  return [state, updateFromOnChange];
};

export default useCheckboxState;
