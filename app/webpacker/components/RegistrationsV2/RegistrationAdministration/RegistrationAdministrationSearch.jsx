import React, { useMemo } from 'react';
import { Icon, Search } from 'semantic-ui-react';
import _ from 'lodash';
import useInputState from '../../../lib/hooks/useInputState';
import useDebounce from '../../../lib/hooks/useDebounce';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';
import { getStatusColor, getStatusIcon } from '../../../lib/utils/registrationAdmin';
import { editRegistrationUrl } from '../../../lib/requests/routes.js.erb';
import I18n from '../../../lib/i18n';

const MIN_SEARCH_TEXT_LEN = 2;

export default function RegistrationAdministrationSearch({
  partitionedRegistrations,
  competitionId,
  usingPayments,
  currencyCode,
}) {
  const [searchText, setSearchText] = useInputState('');
  const debouncedSearchText = useDebounce(searchText);

  const options = useMemo(
    () => Object.fromEntries(
      Object.entries(partitionedRegistrations).map(([status, registrations]) => [
        status,
        {
          name: status,
          results: registrations.map(({ user, competing, payment }) => ({
            title: `${user.name}${user.wca_id ? ` (${user.wca_id})` : ''}`,
            description: `${
              user.email
            }${
              competing.comment
                ? ` ${I18n.t('activerecord.attributes.registration.comments')}: ${competing.comment}`
                : ''
            }${
              competing.admin_comment
                ? ` ${I18n.t('activerecord.attributes.registration.administrative_notes')}: ${competing.admin_comment}`
                : ''
            }`,
            price: usingPayments
              ? isoMoneyToHumanReadable(payment.payment_amount_iso, currencyCode)
              : undefined,
            userId: user.id,
            searchable: {
              name: user.name,
              wcaId: user.wca_id,
              email: user.email,
              comment: competing.comment,
              note: competing.admin_comment,
            },
          })),
        },
      ]),
    ),
    [partitionedRegistrations, usingPayments, currencyCode],
  );

  const filteredResults = useMemo(
    () => {
      if (debouncedSearchText.length < MIN_SEARCH_TEXT_LEN) return {};

      const regExp = new RegExp(_.escapeRegExp(debouncedSearchText), 'i');
      const isMatch = ({ searchable }) => Object.values(searchable).some((str) => regExp.test(str));

      return Object.fromEntries(
        Object.entries(options).map(([status, { name, results }]) => [
          status,
          {
            name,
            results: _.filter(results, isMatch),
          },
        ]).filter(([, { results }]) => results.length > 0),
      );
    },
    [debouncedSearchText, options],
  );

  const navigateToRegistrationEdit = ({ userId }) => {
    window.location.href = editRegistrationUrl(userId, competitionId);
  };

  const renderStatusIcon = ({ name: status }) => (
    <Icon name={getStatusIcon(status)} color={getStatusColor(status)} />
  );

  return (
    <Search
      fluid
      category
      noResultsMessage={debouncedSearchText.length >= MIN_SEARCH_TEXT_LEN ? 'No results' : 'Too few characters'}
      placeholder="Search..."
      value={searchText}
      onResultSelect={(e, { result }) => navigateToRegistrationEdit(result)}
      onSearchChange={setSearchText}
      results={filteredResults}
      categoryRenderer={renderStatusIcon}
    />
  );
}
