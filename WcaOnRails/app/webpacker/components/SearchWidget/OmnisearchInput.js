import React, {
  useState, useEffect, useCallback,
} from 'react';
import { Dropdown, Icon } from 'semantic-ui-react';

import CompetitionItem from './CompetitionItem';
import IncidentItem from './IncidentItem';
import RegulationItem from './RegulationItem';
import UserItem from './UserItem';
import TextItem from './TextItem';
import useDebounce from '../../lib/hooks/useDebounce';
import I18n from '../../lib/i18n';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import '../../stylesheets/search_widget/OmnisearchInput.scss';

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
  className: 'omnisearch-item',
  as: 'div',
});

const itemToOption = (item) => ({
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

function OmnisearchInput({
  url,
  goToItemOnSelect,
  placeholder,
  removeNoResultsMessage,
  onSelect,
  multiple,
}) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(search, DEBOUNCE_MS);

  const [selected, setSelected] = useState([]);

  const handleChange = useCallback((e, { value, options }) => {
    setSearch('');
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
      ].filter(({ id }) => value.includes(id));
      // Redirect user to actual page if needed, and do not change the state.
      if (goToItemOnSelect && newSelected.length > 0) {
        window.location.href = newSelected[0].item.url;
        return oldSelected;
      }
      if (onSelect) {
        onSelect(newSelected);
      }
      return newSelected;
    });
  }, [setSelected, setSearch, goToItemOnSelect]);

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

  const options = [...results];

  // If we go to item on select, we want to give the user the option to go to
  // the search page.
  if (goToItemOnSelect && search.length > 0) {
    options.unshift(createSearchItem(search));
  }

  // FIXME: the search filter from FUI is not the greatest: when searching for
  // "galerie lafa" it won't match the "galeries lafayette" competitions
  // (whereas searching for "galeries lafa" does).
  // We should try to set our own search method that would match word by word.
  if (!multiple && selected.length === 1) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
      }}
      >
        <div className="omnisearch-item">
          <ItemFor
            item={selected[0].item}
          />
        </div>
        <Icon
          name="close"
          onClick={() => {
            setSelected([]);
            onSelect([]);
          }}
        />

      </div>
    );
  }
  return (
    <Dropdown
      fluid
      selection
      multiple
      search
      icon="search"
      className="omnisearch-dropdown"
      value={selected.map(({ id }) => id)}
      searchQuery={search}
      options={options}
      onChange={handleChange}
      onSearchChange={(e, { searchQuery }) => setSearch(searchQuery)}
      loading={loading}
      noResultsMessage={removeNoResultsMessage ? null : I18n.t('search_results.index.not_found.generic')}
      placeholder={placeholder || I18n.t('common.search_site')}
      renderLabel={renderLabel}
    />
  );
}

export default OmnisearchInput;
