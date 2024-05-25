import React from 'react';
import {
  Container, Grid, GridColumn, Tab, TabPane,
} from 'semantic-ui-react';
import Details from './Details';
import PersonalRecords from './PersonalRecords';
import MedalCollection from './MedalCollection';
import RecordCollection from './RecordCollection';
import I18n from '../../../lib/i18n';
import RegionalRecords from './RegionalRecords';
import RegionalChampionshipPodiums from './RegionalChampionshipPodiums';
import CompetitionsMap from './CompetitionsMap';

function TabSection({ person }) {
  // TODO: Url Params?
  const panes = [];
  if (person.records.total > 0) {
    panes.push({
      menuItem: I18n.t('persons.show.records'),
      render: () => (
        <TabPane>
          <RegionalRecords person={person} />
        </TabPane>
      ),
    });
  }

  const anyPodiums = Object
    .values(person.championshipPodiums)
    .some((podiums) => podiums.length > 0);
  if (anyPodiums) {
    panes.push({
      menuItem: I18n.t('persons.show.championship_podiums'),
      render: () => (
        <TabPane>
          <RegionalChampionshipPodiums person={person} />
        </TabPane>
      ),
    });
  }

  panes.push({
    menuItem: I18n.t('persons.show.competitions_map'),
    render: () => (
      <TabPane>
        <CompetitionsMap person={person} />
      </TabPane>
    ),
  });

  return (
    <div>
      <Tab defaultActiveIndex={1} panes={panes} />
    </div>
  );
}

export default function Person({
  person,
  canEditUser,
  editUrl,
}) {
  const medalsAndRecords = (person.medals.total > 0 ? 1 : 0)
    + (person.records.total > 0 ? 1 : 0);

  return (
    <Container textAlign="center" id="person">
      <Details
        person={person}
        canEditUser={canEditUser}
        editUrl={editUrl}
      />
      <PersonalRecords
        person={person}
        averageRanks={person.averageRanks}
        singleRanks={person.singleRanks}
      />
      {medalsAndRecords > 0 && (
        <Grid columns={medalsAndRecords} stackable>
          {person.medals.total > 0 && (
            <GridColumn>
              <MedalCollection person={person} />
            </GridColumn>
          )}
          {person.records.total > 0 && (
            <GridColumn>
              <RecordCollection person={person} />
            </GridColumn>
          )}
        </Grid>
      )}
      <br />
      <TabSection person={person} />
    </Container>
  );
}
