import React from 'react';
import {
  Card, Header, Icon, Statistic,
} from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import Badges from '../Badges';
import CountryFlag from '../../wca/CountryFlag';
import I18n from '../../../lib/i18n';
import { countries } from '../../../lib/wca-data.js.erb';
import { editPersonUrl } from '../../../lib/requests/routes.js.erb';

function PreviousDetails({ prev }) {
  return (
    <Header as="h4">
      (
      <I18nHTMLTranslate i18nKey="persons.show.previously" />
      {' '}
      {prev
        .map((previousPerson) => `${previousPerson.name} - ${countries.byIso2[previousPerson.country_iso2].name}`)
        .join(', ')}
      )
    </Header>
  );
}

export default function Details({
  person,
  previousPersons,
  canEditUser,
}) {
  return (
    <>
      {person.user?.avatar && (
        <Card image={person.user.avatar.url} centered raised />
      )}
      <Header as="h2" textAlign="center">
        <CountryFlag iso2={person.country_iso2} />
        {' '}
        {person.name}
        {canEditUser && (
          <a href={editPersonUrl(person.user.id)}>
            {' '}
            <Icon name="edit" />
          </a>
        )}
      </Header>
      {previousPersons.length > 0 && <PreviousDetails prev={previousPersons} />}
      {person.user && <Badges userId={person.user.id} />}
      <Statistic.Group size="tiny" widths={2}>
        <Statistic>
          <Statistic.Label>{I18n.t('common.user.wca_id')}</Statistic.Label>
          <Statistic.Value>{person.wca_id}</Statistic.Value>
        </Statistic>
        <Statistic>
          <Statistic.Label>{I18n.t('persons.show.completed_solves')}</Statistic.Label>
          <Statistic.Value>{person.completed_solves_count}</Statistic.Value>
        </Statistic>
        {person.visible_gender && (
          <Statistic>
            <Statistic.Label>{I18n.t('activerecord.attributes.person.gender')}</Statistic.Label>
            <Statistic.Value>{I18n.t(`enums.user.gender.${person.visible_gender}`)}</Statistic.Value>
          </Statistic>
        )}
        <Statistic>
          <Statistic.Label>{I18n.t('layouts.navigation.competitions')}</Statistic.Label>
          <Statistic.Value>{person.competition_count}</Statistic.Value>
        </Statistic>
      </Statistic.Group>
    </>
  );
}
