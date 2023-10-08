import React, { useState, useCallback } from 'react';

import MultiSearchInput from './MultiSearchInput';
import '../../stylesheets/search_widget/OmnisearchInput.scss';

function OmnisearchInput({
  url,
  goToItemOnSelect,
  placeholder,
  removeNoResultsMessage,
  onSearchChange,
}) {
  const [selected, setSelected] = useState([]);

  const handleChange = useCallback((e, { value, options }) => {
    // Here we have "value" which contains the ids of the elements selected,
    // "oldSelected" which contains the previously selected elements,
    // "options" which contains the currently displayed options.
    // "options" changes over time, and may not contain previously selected
    // elements anymore: we need to make sure the new "selected" value includes
    // all elements details for the elements in "value", they may come either
    // from "oldSelected" or "options".
    setSelected((oldSelected) => {
      const newSelected = [
        ...new Set(oldSelected.concat(options)),
      ].filter((item) => value.includes(item.id));
      // Redirect user to actual page if needed, and do not change the state.
      if (goToItemOnSelect && newSelected.length > 0) {
        window.location.href = newSelected[0].item.url;
        return oldSelected;
      }
      return newSelected;
    });

    if (onSearchChange) {
      onSearchChange(e, { value, options });
    }
  }, [setSelected, onSearchChange, goToItemOnSelect]);

  return (
    <MultiSearchInput
      url={url}
      goToItemOnSelect={goToItemOnSelect}
      placeholder={placeholder}
      removeNoResultsMessage={removeNoResultsMessage}
      onChange={handleChange}
      selectedItems={selected}
    />
  );
}

export default OmnisearchInput;
