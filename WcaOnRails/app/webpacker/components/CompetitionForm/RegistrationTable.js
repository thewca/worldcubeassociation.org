/* eslint-disable react/no-danger */
import React, { useEffect, useState } from 'react';
import {
  Table, Message,
} from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import Loading from '../Requests/Loading';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { registrationNearbyJsonUrl } from '../../lib/requests/routes.js.erb';
import { FieldWrapper } from './FormInputs';

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

function RegistrationTableContent({ comps }) {
  const headerRow = () => (
    <Table.Row>
      <Table.HeaderCell name="name" width={3}>
        {I18n.t('competitions.adjacent_competitions.name')}
      </Table.HeaderCell>
      <Table.HeaderCell name="delegates" width={3}>
        {I18n.t('competitions.adjacent_competitions.delegates')}
      </Table.HeaderCell>
      <Table.HeaderCell name="time" width={2}>
        {I18n.t('competitions.adjacent_competitions.time')}
      </Table.HeaderCell>
      <Table.HeaderCell name="location" width={2}>
        {I18n.t('competitions.adjacent_competitions.location')}
      </Table.HeaderCell>
    </Table.Row>
  );

  const compRow = (comp) => (
    <Table.Row key={comp.name} warning={!comp.danger} error={comp.danger}>
      <Table.Cell name="name" width={3}>
        <span dangerouslySetInnerHTML={{ __html: comp.nameLink }} />
        {comp.confirmed && <NotConfirmedIcon />}
      </Table.Cell>
      <Table.Cell name="delegates" width={2}>
        <span dangerouslySetInnerHTML={{ __html: comp.delegates }} />
      </Table.Cell>
      <Table.Cell
        name="time"
        width={2}
        data-toggle="tooltip"
        data-placement="top"
        data-container="body"
        title={`${comp.name} ${I18n.t('competitions.colliding_registration_start_competitions.opens_registration_at')} ${comp.registrationOpen}`}
      >
        {I18n.t('datetime.distance_in_words.x_minutes', { count: Math.abs(comp.minutesUntil) })}
        {' '}
        {comp.minutesUntil < 0
          ? I18n.t('competitions.adjacent_competitions.before')
          : I18n.t('competitions.adjacent_competitions.after')}
      </Table.Cell>
      <Table.Cell name="location" width={2}>
        {comp.location}
      </Table.Cell>
    </Table.Row>
  );

  return (
    <Table structured>
      <Table.Header>
        {headerRow()}
      </Table.Header>
      <Table.Body>
        {comps.reverse().map((comp) => compRow(comp))}
      </Table.Body>
    </Table>
  );
}

function MissingInfo({ missingDate }) {
  return (
    <Message negative>
      {missingDate && (<p>{I18n.t('competitions.colliding_registration_start_competitions.no_registration_start_date_yet')}</p>)}
    </Message>
  );
}

export default function RegistrationTable({ regStartData }) {
  const [comps, setComps] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!regStartData.value) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.append(`competition[${regStartData.attribute}]`, regStartData.value);

    fetchJsonOrError(`${registrationNearbyJsonUrl}?${params.toString()}`)
      .then(({ data }) => {
        setComps(data);
        setLoading(false);
      });
  }, [regStartData.value]);

  if (loading) return <Loading />;
  if (!regStartData) {
    return (
      <MissingInfo
        missingDate={!regStartData.value}
      />
    );
  }

  if (!comps || comps.length === 0) {
    return (
      <Message positive>
        {I18n.t('competitions.colliding_registration_start_competitions.no_comp_colliding')}
      </Message>
    );
  }

  const label = I18n.t('competitions.colliding_registration_start_competitions.label', { hours: 3 });

  return (
    <FieldWrapper label={label}>
      <RegistrationTableContent comps={comps} />
    </FieldWrapper>
  );
}
