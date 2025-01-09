import React, { useMemo, useRef, useState } from 'react';
import {
  Container, Divider, Grid, Segment, Sticky, Tab,
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
        <Tab.Pane>
          <Results
            results={results}
            pbMarkers={pbMarkers}
            highlightPosition={highlight}
            competitions={competitions}
          />
        </Tab.Pane>
      ),
    }];
    if (records.total > 0) {
      p.push({
        menuItem: I18n.t('persons.show.records'),
        tabSlug: 'record',
        render: () => (
          <Tab.Pane>
            <RegionalRecords results={results} competitions={competitions} />
          </Tab.Pane>
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
          <Tab.Pane>
            <RegionalChampionshipPodiums
              results={results}
              championshipPodiums={championshipPodiums}
              competitions={competitions}
            />
          </Tab.Pane>
        ),
      });
    }

    const competitionValues = Object.values(competitions);

    p.push({
      menuItem: I18n.t('persons.show.competitions_map'),
      tabSlug: 'map',
      render: () => (
        <Tab.Pane>
          <CompetitionsMap competitions={competitionValues} />
        </Tab.Pane>
      ),
    });
    return p;
  }, [records, championshipPodiums, competitions, results, pbMarkers, highlight]);

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
        <Grid centered stackable>
          <Grid.Row>
            <Grid.Column width={4} only="computer tablet">
              <Sticky context={ref}>
                <Segment raised>
                  <Details
                    person={person}
                    previousPersons={previousPersons}
                    canEditUser={canEditUser}
                  />
                </Segment>
              </Sticky>
            </Grid.Column>
            <Grid.Column width={4} only="mobile">
              <Segment raised>
                <Details
                  person={person}
                  previousPersons={previousPersons}
                  canEditUser={canEditUser}
                />
              </Segment>
            </Grid.Column>
            <Grid.Column width={12}>
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
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    </div>
  );
}
