/* eslint-disable react/no-danger */
import React, { useEffect, useState } from 'react';
import { Table } from 'semantic-ui-react';
import { Alert } from 'react-bootstrap';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { FieldWrapper } from './FormInputs';
import { competitionNearbyJsonUrl } from '../../lib/requests/routes.js.erb';
import I18n from '../../lib/i18n';

function NotConfirmedIcon() {
  return (
    <i
      className="fas fa-exclamation-circle"
      data-toggle="tooltip"
      data-placement="top"
      data-container="body"
      title="This competition is not confirmed yet."
    />
  );
}

function CompsTable({ nearby }) {
  const headerRow = () => (
    <Table.Row>
      <Table.HeaderCell name="name" width={3}>
        {I18n.t('competitions.adjacent_competitions.name')}
      </Table.HeaderCell>
      <Table.HeaderCell name="delegates" width={3}>
        {I18n.t('competitions.adjacent_competitions.delegates')}
      </Table.HeaderCell>
      <Table.HeaderCell name="date" width={2}>
        {I18n.t('competitions.adjacent_competitions.date')}
      </Table.HeaderCell>
      <Table.HeaderCell name="location" width={2}>
        {I18n.t('competitions.adjacent_competitions.location')}
      </Table.HeaderCell>
      <Table.HeaderCell name="distance" width={1}>
        {I18n.t('competitions.adjacent_competitions.distance')}
      </Table.HeaderCell>
      <Table.HeaderCell name="limit" width={1}>
        {I18n.t('competitions.adjacent_competitions.limit')}
      </Table.HeaderCell>
      <Table.HeaderCell name="competitors" width={1}>
        {I18n.t('competitions.adjacent_competitions.competitors')}
      </Table.HeaderCell>
      <Table.HeaderCell name="events" width={2}>
        {I18n.t('competitions.adjacent_competitions.events')}
      </Table.HeaderCell>
    </Table.Row>
  );

  const compRow = (comp) => (
    <Table.Row warning={!comp.danger} error={comp.danger}>
      <Table.Cell name="name" width={3}>
        <span dangerouslySetInnerHTML={{ __html: comp.nameLink }} />
        {comp.confirmed ? null : <NotConfirmedIcon />}
      </Table.Cell>
      <Table.Cell name="delegates" width={2}>
        <span dangerouslySetInnerHTML={{ __html: comp.delegates }} />
      </Table.Cell>
      <Table.Cell name="date" width={2} data-toggle="tooltip" data-placement="top" data-container="body" title={comp.days_until_tooltip}>
        {comp.days_distance_in_words}
        {' '}
        {comp.days_until < 0 ? I18n.t('competitions.adjacent_competitions.before') : I18n.t('competitions.adjacent_competitions.after')}
      </Table.Cell>
      <Table.Cell name="location" width={2}>
        {comp.location}
      </Table.Cell>
      <Table.Cell name="distance" width={2} singleLine>
        <span dangerouslySetInnerHTML={{ __html: comp.distance }} />
      </Table.Cell>
      <Table.Cell name="limit" width={1}>
        {comp.limit ? comp.limit : ''}
      </Table.Cell>
      <Table.Cell name="competitors" width={1}>
        {comp.competitors ? comp.competitors : ''}
      </Table.Cell>
      <Table.Cell name="events" width={2}>
        {comp.events.map((e) => <span dangerouslySetInnerHTML={{ __html: e }} />)}
      </Table.Cell>
    </Table.Row>
  );

  return (
    <Table structured>
      <Table.Header>
        {headerRow()}
      </Table.Header>
      <Table.Body>
        {nearby.map((comp) => compRow(comp))}
      </Table.Body>
    </Table>
  );
}

export default function NearbyCompetitions({
  latData, longData, startDateData, endDateData,
}) {
  const [nearby, setNearby] = useState([]);

  const fieldLabel = 'Nearby competitions\n(within 5 days and 10 km)';

  useEffect(() => {
    if (!latData.value || !longData.value || !startDateData.value || !endDateData.value) return;
    const params = new URLSearchParams();
    params.append(`competition[${latData.attribute}]`, latData.value);
    params.append(`competition[${longData.attribute}]`, longData.value);
    params.append(`competition[${startDateData.attribute}]`, startDateData.value);
    params.append(`competition[${endDateData.attribute}]`, endDateData.value);

    fetchJsonOrError(`${competitionNearbyJsonUrl}?${params.toString()}`).then(({ data }) => {
      setNearby(data);
    });
  }, [latData.value, longData.value, startDateData.value, endDateData.value]);

  // TODO: Loading indicator?
  return (
    <FieldWrapper label={fieldLabel}>
      {!nearby || nearby.length === 0
        ? (
          <Alert bsStyle="success">
            {I18n.t('competitions.adjacent_competitions.no_comp_nearby')}
          </Alert>
        ) : <CompsTable nearby={nearby} />}
    </FieldWrapper>
  );
}
