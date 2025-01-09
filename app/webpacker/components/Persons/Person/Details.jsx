import React from 'react';
import {
  Card, Divider, Grid, GridColumn, GridRow, Header, Icon, Statistic, StatisticGroup, StatisticLabel, StatisticValue,
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
        <CountryFlag iso2={person.countryIso2} />
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
      <StatisticGroup size="tiny" widths={2}>
        <Statistic>
          <StatisticLabel>{I18n.t('common.user.wca_id')}</StatisticLabel>
          <StatisticValue>{person.wcaId}</StatisticValue>
        </Statistic>
        <Statistic>
          <StatisticLabel>{I18n.t('persons.show.completed_solves')}</StatisticLabel>
          <StatisticValue>{person.completedSolves}</StatisticValue>
        </Statistic>
        {person.gender && (
          <Statistic>
            <StatisticLabel>{I18n.t('activerecord.attributes.person.gender')}</StatisticLabel>
            <StatisticValue>{I18n.t(`enums.user.gender.${person.gender}`)}</StatisticValue>
          </Statistic>
        )}
        <Statistic>
          <StatisticLabel>{I18n.t('layouts.navigation.competitions')}</StatisticLabel>
          <StatisticValue>{person.competitionCount}</StatisticValue>
        </Statistic>
      </StatisticGroup>
    </>
  );
}
