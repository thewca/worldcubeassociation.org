// TODO: this keeps happening? should we keep ignoring?
/* eslint-disable jsx-a11y/control-has-associated-label */
import React from 'react';
import {
  Icon,
  Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow,
} from 'semantic-ui-react';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import Badges from './Badges';

function PreviousDetails({ prev }) {
  return (
    <h4>
      (
      <I18nHTMLTranslate i18nKey="persons.show.previously" />
      {' '}
      {prev
        .map((previousPerson) => `${previousPerson.name} - ${previousPerson.country}`)
        .join(', ')}
      )
    </h4>
  );
}

function FlagIcon({ countryIso2 }) {
  return (
    <span
      className={`fi fi-${countryIso2.toLowerCase()}`}
    />
  );
}

export default function Details({
  person,
  canEditUser,
  editUrl,
}) {
  return (
    <>
      <div className="text-center">
        <h2>
          {person.name + (canEditUser ? ' ' : '')}
          {canEditUser && (
            <a href={editUrl}>
              {' '}
              <Icon name="edit" />
            </a>
          )}
        </h2>
        {person.previousPersons.length > 0 && <PreviousDetails prev={person.previousPersons} />}
        {person.user && <Badges userId={person.user.id} />}
        {person.user?.avatar && (
          <img
            className="avatar"
            src={person.user.avatar.url}
            alt="User avatar"
          />
        )}
      </div>
      <div className="details" style={{ marginBottom: '0.75rem' }}>
        <Table striped basic="very" textAlign="center" structured unstackable>
          <TableHeader fullWidth>
            <TableRow textAlign="center">
              <TableHeaderCell>
                <I18nHTMLTranslate i18nKey="common.country" />
              </TableHeaderCell>
              <TableHeaderCell>
                <I18nHTMLTranslate i18nKey="common.user.wca_id" />
              </TableHeaderCell>
              {person.gender && (
                <TableHeaderCell>
                  <I18nHTMLTranslate i18nKey="activerecord.attributes.person.gender" />
                </TableHeaderCell>
              )}
              <TableHeaderCell>
                <I18nHTMLTranslate i18nKey="layouts.navigation.competitions" />
              </TableHeaderCell>
              <TableHeaderCell>
                <I18nHTMLTranslate i18nKey="persons.show.completed_solves" />
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* trick to have first row striped */}
            <TableRow style={{ display: 'none' }} />
            <TableRow>
              <TableCell>
                <FlagIcon countryIso2={person.country.iso2} />
                {' '}
                {person.country.name}
              </TableCell>
              <TableCell>
                {person.wcaId}
              </TableCell>
              {person.gender && (
                <TableCell>
                  <I18nHTMLTranslate i18nKey={`enums.user.gender.${person.gender}`} />
                </TableCell>
              )}
              <TableCell>
                {person.competitionCount}
              </TableCell>
              <TableCell>
                {person.completedSolves}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  );
}
