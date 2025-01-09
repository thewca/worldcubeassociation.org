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

function TabSection({
  person,
  results,
  records,
  competitions,
  championshipPodiums,
  pbMarkers,
  highlight,
}) {
  const panes = useMemo(() => {
    const p = [{
      menuItem: I18n.t('persons.show.results'),
      tabSlug: 'results-by-event',
      render: () => (
        <TabPane>
          <Results
            results={results}
            pbMarkers={pbMarkers}
            highlightPosition={highlight}
            competitions={competitions}
          />
        </TabPane>
      ),
    }];
    if (records.total > 0) {
      p.push({
        menuItem: I18n.t('persons.show.records'),
        tabSlug: 'record',
        render: () => (
          <TabPane>
            <RegionalRecords results={results} competitions={competitions} />
          </TabPane>
        ),
      });
    }

    const anyPodiums = Object
      .values(championshipPodiums)
      .some((podiums) => podiums.length > 0);

    if (anyPodiums) {
      p.push({
        menuItem: I18n.t('persons.show.championship_podiums'),
        tabSlug: 'championship-podiums',
        render: () => (
          <TabPane>
            <RegionalChampionshipPodiums
              results={results}
              championshipPodiums={championshipPodiums}
              competitions={competitions}
            />
          </TabPane>
        ),
      });
    }

    const competitionValues = Object.values(competitions);

    p.push({
      menuItem: I18n.t('persons.show.competitions_map'),
      tabSlug: 'map',
      render: () => (
        <TabPane>
          <CompetitionsMap competitions={competitionValues} />
        </TabPane>
      ),
    });
    return p;
  }, [records, championshipPodiums, person, pbMarkers, highlight, competitions]);

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
  previousPersons,
  results,
  averageRanks,
  singleRanks,
  competitions,
  medals,
  records,
  pbMarkers,
  championshipPodiums,
  canEditUser,
}) {
  const [highlight, setHighlight] = useState(-1);

  const medalsAndRecords = (medals.total > 0 ? 1 : 0)
    + (records.total > 0 ? 1 : 0);

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
                    previousPersons={previousPersons}
                    canEditUser={canEditUser}
                  />
                </Segment>
              </Sticky>
            </GridColumn>
            <GridColumn width={4} only="mobile">
              <Segment raised>
                <Details
                  person={person}
                  previousPersons={previousPersons}
                  canEditUser={canEditUser}
                />
              </Segment>
            </GridColumn>
            <GridColumn width={12}>
              <Segment raised>
                <PersonalRecords
                  results={results}
                  averageRanks={averageRanks}
                  singleRanks={singleRanks}
                  competitions={competitions}
                />
              </Segment>
              {medalsAndRecords > 0 && (
                <Grid columns={medalsAndRecords} stackable>
                  <CountStats medals={medals} records={records} setHighlight={setHighlight} />
                </Grid>
              )}
              <Divider />
              <TabSection
                person={person}
                results={results}
                records={records}
                competitions={competitions}
                championshipPodiums={championshipPodiums}
                pbMarkers={pbMarkers}
                highlight={highlight}
              />
            </GridColumn>
          </GridRow>
        </Grid>
      </Container>
    </div>
  );
}
