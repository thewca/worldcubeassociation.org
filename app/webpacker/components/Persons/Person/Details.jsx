import React from 'react';
import {
  Card, Grid, GridColumn, GridRow, Header, Icon,
} from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import Badges from '../Badges';
import CountryFlag from '../../wca/CountryFlag';
import I18n from '../../../lib/i18n';

function PreviousDetails({ prev }) {
  return (
    <Header as="h4">
      (
      <I18nHTMLTranslate i18nKey="persons.show.previously" />
      {' '}
      {prev
        .map((previousPerson) => `${previousPerson.name} - ${previousPerson.country}`)
        .join(', ')}
      )
    </Header>
  );
}

export default function Details({
  person,
  canEditUser,
  editUrl,
}) {
  return (
    <>
      {person.user?.avatar && (
        <Card image={person.user.avatar.url} centered />
      )}
      <Header as="h2" textAlign="center">
        <CountryFlag iso2={person.country.iso2} />
        {' '}
        {person.name + (canEditUser ? ' ' : '')}
        {canEditUser && (
          <a href={editUrl}>
            {' '}
            <Icon name="edit" />
          </a>
        )}
      </Header>
      {person.previousPersons.length > 0 && <PreviousDetails prev={person.previousPersons} />}
      {person.user && <Badges userId={person.user.id} />}
      <Grid textAlign="center">
        <GridRow>
          <GridColumn width={8}>
            <Header as="h4">
              {I18n.t('common.user.wca_id')}
            </Header>
            {person.wcaId}
            <Header as="h4">
              <I18nHTMLTranslate i18nKey="persons.show.completed_solves" />
            </Header>
            {person.completedSolves}
          </GridColumn>
          <GridColumn width={8}>
            {person.gender && (
              <Header as="h4">
                <I18nHTMLTranslate i18nKey="activerecord.attributes.person.gender" />
              </Header>
            )}
            <I18nHTMLTranslate i18nKey={`enums.user.gender.${person.gender}`} />
            <Header as="h4">
              <I18nHTMLTranslate i18nKey="layouts.navigation.competitions" />
            </Header>
            {person.competitionCount}
          </GridColumn>
        </GridRow>
      </Grid>
    </>
  );
}
