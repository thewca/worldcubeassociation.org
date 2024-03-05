import React, { useState, useEffect } from 'react';
import { Dropdown } from 'semantic-ui-react';

import CompetitionItem from './CompetitionItem';
import IncidentItem from './IncidentItem';
import RegulationItem from './RegulationItem';
import UserItem from './UserItem';
import TextItem from './TextItem';
import useDebounce from '../../lib/hooks/useDebounce';
import I18n from '../../lib/i18n';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import '../../stylesheets/search_widget/MultisearchInput.scss';

const classToComponent = {
  user: UserItem,
  person: UserItem,
  competition: CompetitionItem,
  regulation: RegulationItem,
  text: TextItem,
  incident: IncidentItem,
};

function ItemFor({ item }) {
  const Component = classToComponent[item.class];
  return (
    <div className="selected-item">
      <Component item={item} />
    </div>
  );
}

const renderLabel = ({ item }) => ({
  color: 'blue',
  content: <ItemFor item={item} />,
  className: 'multisearch-item',
  as: 'div',
});

export const itemToOption = (item) => ({
  item,
  id: item.id,
  key: item.id,
  value: item.id,
  // 'text' is used by the search method from the component, we need to put
  // the text with a potential match here!
  text: [item.id, item.name, item.title, item.content_html, item.search, item.public_summary].join(' '),
  content: <ItemFor item={item} />,
});

const createSearchItem = (search) => itemToOption({
  class: 'text',
  id: 'search',
  url: `/search?q=${encodeURIComponent(search)}`,
  search,
});

const DEBOUNCE_MS = 300;

export default function MultiSearchInput({
  url,
  // If multiple is true, selectedValue is an array of items, otherwise it's a single item.
  selectedValue,
  // onChange should have the same signature as other SemUI form elements: (event, data) => void.
  // If multiple is true, data.value is an array of items, otherwise it's a single item.
  onChange,
  showOptionToGoToSearchPage = false,
  goToItemUrlOnClick = false,
  placeholder,
  removeNoResultsMessage,
  disabled = false,
  multiple = true,
}) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(search, DEBOUNCE_MS);

  useEffect(() => {
    setSearch('');
  }, [selectedValue]);

  useEffect(() => {
    // Do nothing if search string is empty: we're just loading the page
    // or we just selected an item.
    // Either way, we want to keep the existing results.
    if (debouncedSearch.length === 0) return;
    if (debouncedSearch.length < 3) {
      setResults([]);
    } else {
      setLoading(true);
      // Note: we don't need to do any filtering on the results here,
      // FUI's dropdown will automatically remove selected items from the
      // options left for selection.
      fetchJsonOrError(url(debouncedSearch))
        .then(({ data }) => setResults(data.result.map(itemToOption)))
        .finally(() => setLoading(false));
    }
  }, [debouncedSearch, url]);

  const dropDownOptions = [
    ...(showOptionToGoToSearchPage && search.length > 0 ? [createSearchItem(search)] : []),
    ...(multiple ? selectedValue : []),
    ...results,
  ].map((option) => ({
    ...option,
    text: <ItemFor item={option.item} />,
  }));

  const onChangeInternal = (evt, data) => {
    const { value, options } = data;

    const map = Object.fromEntries(
      options.map((option) => [option.value, option]),
    );

    if (multiple) {
      const valueOptions = value.map((id) => itemToOption(map[id].item));
      const changePayload = { ...data, value: valueOptions };

      onChange(evt, changePayload);
    } else {
      const newSelectedValue = map[value] ? itemToOption(map[value].item) : null;

      // Redirect user to actual page if needed, and do not change the state.
      if (goToItemUrlOnClick && newSelectedValue?.item?.url !== null) {
        window.location.href = newSelectedValue.item.url;
      }

      const changePayload = { ...data, value: newSelectedValue };
      onChange(evt, changePayload);
    }
  };

  return (
    <Dropdown
      fluid
      selection
      multiple={multiple}
      search={(values) => values.slice(0, 5)}
      clearable={!multiple}
      icon="search"
      className="multisearch-dropdown"
      disabled={disabled}
      value={multiple ? selectedValue.map((item) => item.id) : selectedValue?.id}
      searchQuery={search}
      options={dropDownOptions}
      onChange={onChangeInternal}
      onSearchChange={(e, { searchQuery }) => setSearch(searchQuery)}
      loading={loading}
      noResultsMessage={removeNoResultsMessage ? null : I18n.t('search_results.index.not_found.generic')}
      placeholder={placeholder || I18n.t('common.search_site')}
      renderLabel={renderLabel}
    />
  );
}
