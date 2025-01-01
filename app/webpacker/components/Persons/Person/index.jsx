import React from 'react';
import {
  Container, Grid, GridColumn, GridRow, Segment, Tab, TabPane,
} from 'semantic-ui-react';
import Details from './Details';
import PersonalRecords from './PersonalRecords';
import MedalCollection from './MedalCollection';
import RecordCollection from './RecordCollection';
import I18n from '../../../lib/i18n';
import RegionalRecords from './RegionalRecords';
import RegionalChampionshipPodiums from './RegionalChampionshipPodiums';
import CompetitionsMap from './CompetitionsMap';
import Results from './Results';

function TabSection({ person }) {
  // TODO: Url Params?
  const panes = [{
    menuItem: I18n.t('persons.show.results'),
    render: () => (
      <TabPane>
        <Results person={person} />
      </TabPane>
    ),
  }];
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
      <Tab renderActiveOnly defaultActiveIndex={0} panes={panes} />
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
    <Grid columns={2}>
      <GridRow>
        <GridColumn width={4}>
          <Segment>
            <Details
              person={person}
              canEditUser={canEditUser}
              editUrl={editUrl}
            />
          </Segment>
        </GridColumn>
        <GridColumn width={12}>
          <Segment>
            <PersonalRecords
              person={person}
              averageRanks={person.averageRanks}
              singleRanks={person.singleRanks}
            />
          </Segment>
          {medalsAndRecords > 0 && (
            <Segment>
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
            </Segment>
          )}
          <Segment>
            <TabSection person={person} />
          </Segment>
        </GridColumn>
      </GridRow>
    </Grid>
  );
}
