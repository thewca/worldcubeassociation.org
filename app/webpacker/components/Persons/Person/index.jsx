import React, { useMemo, useRef, useState } from 'react';
import {
  Container, Divider, Grid, GridColumn, GridRow, Segment, Sticky, Tab, TabPane,
} from 'semantic-ui-react';
import Details from './Details';
import PersonalRecords from './PersonalRecords';
import I18n from '../../../lib/i18n';
import RegionalRecords from './RegionalRecords';
import RegionalChampionshipPodiums from './RegionalChampionshipPodiums';
import CompetitionsMap from './CompetitionsMap';
import Results from './Results';
import CountStats from './CountStats';

function TabSection({ person, highlight }) {
  const panes = useMemo(() => {
    const p = [{
      menuItem: I18n.t('persons.show.results'),
      tabSlug: 'results-by-event',
      render: () => (
        <TabPane>
          <Results person={person} highlightPosition={highlight} />
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
  }, [person, highlight]);

  const tabSlug = new URL(document.location.toString()).searchParams.get('tab');
  const activeIndex = tabSlug ? panes.findIndex((p) => p.tabSlug === tabSlug) : 0;

  return (
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
  );
}

export default function Person({
  person,
  canEditUser,
  editUrl,
}) {
  const [highlight, setHighlight] = useState(-1);
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
                <Grid columns={medalsAndRecords} stackable>
                  <CountStats person={person} setHighlight={setHighlight} />
                </Grid>
              )}
              <Divider />
              <TabSection person={person} highlight={highlight} />
            </GridColumn>
          </GridRow>
        </Grid>
      </Container>
    </div>
  );
}
