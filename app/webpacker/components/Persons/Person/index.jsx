import React, { useMemo, useRef } from 'react';
import {
  Container, Grid, GridColumn, GridRow, Segment, Sticky, Tab, TabPane,
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
  const panes = useMemo(() => {
    const p = [{
      menuItem: I18n.t('persons.show.results'),
      tabSlug: 'results-by-event',
      render: () => (
        <TabPane>
          <Results person={person} />
        </TabPane>
      ),
    }];
    if (person.records.total > 0) {
      p.push({
        menuItem: I18n.t('persons.show.records'),
        tabSlug: 'record',
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
      p.push({
        menuItem: I18n.t('persons.show.championship_podiums'),
        tabSlug: 'championship-podiums',
        render: () => (
          <TabPane>
            <RegionalChampionshipPodiums person={person} />
          </TabPane>
        ),
      });
    }

    p.push({
      menuItem: I18n.t('persons.show.competitions_map'),
      tabSlug: 'map',
      render: () => (
        <TabPane>
          <CompetitionsMap person={person} />
        </TabPane>
      ),
    });
    return p;
  }, [person]);

  const tabSlug = new URL(document.location.toString()).searchParams.get('tab');
  const activeIndex = tabSlug ? panes.findIndex((p) => p.tabSlug === tabSlug) : 0;

  return (
    <div>
      <Tab
        renderActiveOnly
        defaultActiveIndex={activeIndex}
        panes={panes}
        menu={{ fluid: true, widths: panes.length }}
        onTabChange={(a, b) => {
          const newSlug = panes[b.activeIndex].tabSlug;
          const url = new URL(window.location.href);
          url.searchParams.set('tab', newSlug);
          window.history.pushState({}, '', url);
        }}
      />
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
  const ref = useRef();

  return (
    <div ref={ref}>
      <Container fluid>
        <Grid columns={2} stackable>
          <GridRow>
            <GridColumn width={4} only="computer tablet">
              <Sticky context={ref}>
                <Segment raised>
                  <Details
                    person={person}
                    canEditUser={canEditUser}
                    editUrl={editUrl}
                  />
                </Segment>
              </Sticky>
            </GridColumn>
            <GridColumn width={4} only="mobile">
              <Segment raised>
                <Details
                  person={person}
                  canEditUser={canEditUser}
                  editUrl={editUrl}
                />
              </Segment>
            </GridColumn>
            <GridColumn width={12}>
              <Segment raised>
                <PersonalRecords
                  person={person}
                  averageRanks={person.averageRanks}
                  singleRanks={person.singleRanks}
                />
              </Segment>
              {medalsAndRecords > 0 && (
              <Segment raised>
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
              <TabSection person={person} />
            </GridColumn>
          </GridRow>
        </Grid>
      </Container>
    </div>
  );
}
