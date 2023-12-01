import React from 'react';
import { Accordion, Header, Icon, Table, TableBody, TableHeader, Popup } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import { competitionReportEditUrl, competitionReportUrl } from '../../lib/requests/routes.js.erb';

function upcomingCompetitionTable(competitions, permissions){
  return (
    <Table color="green">
      <TableHeader>
        <Table.Row>
          <Table.HeaderCell>
            {I18n.t('competitions.adjacent_competitions.name')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {I18n.t('competitions.adjacent_competitions.location')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {I18n.t('competitions.adjacent_competitions.date')}
          </Table.HeaderCell>
          <Table.HeaderCell />
          <Table.HeaderCell />
          <Table.HeaderCell />
        </Table.Row>

      </TableHeader>
      <TableBody>
        {competitions.map((competition) => (
          <Table.Row>
            <Table.Cell>
              {competition.name}
            </Table.Cell>
            <Table.Cell>
              {competition.location}
            </Table.Cell>
            <Table.Cell>
              {competition.date}
            </Table.Cell>
            <Table.Cell>
              {!competition['results_posted?'] && <Icon name="calendar" />}
            </Table.Cell>
            <Table.Cell>
              {competition['results_posted?'] && <Icon name="check circle" />}
            </Table.Cell>
            <Table.Cell>
              {(permissions.can_administer_competition === '*' || permissions.can_administer_competition.includes(competition.id)) && (
                <>
                  <Popup
                    content="Add users to your feed"
                    trigger={(
                      <a href={competitionReportUrl(competition.id)}>
                        <Icon name="file alternate" />
                      </a>
                    )}
                  />

                  <a href={competitionReportEditUrl(competition.id)}>
                    <Icon name="edit" />
                  </a>
                </>
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </TableBody>
    </Table>
  );
}

function pastCompetitionsTable(competitions, permissions) {
  return (
    <Table striped>
      <TableHeader>
        <Table.Row>
          <Table.HeaderCell>
            {I18n.t('competitions.adjacent_competitions.name')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {I18n.t('competitions.adjacent_competitions.location')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {I18n.t('competitions.adjacent_competitions.date')}
          </Table.HeaderCell>
          <Table.HeaderCell />
          <Table.HeaderCell />
          <Table.HeaderCell />
        </Table.Row>

      </TableHeader>
      <TableBody>
        {competitions.map((competition) => (
          <Table.Row>
            <Table.Cell>
              {competition.name}
            </Table.Cell>
            <Table.Cell>
              {competition.location}
            </Table.Cell>
            <Table.Cell>
              {competition.date}
            </Table.Cell>
            <Table.Cell>
              {!competition['results_posted?'] && <Icon name="calendar" />}
            </Table.Cell>
            <Table.Cell>
              {competition['results_posted?'] && <Icon name="check circle" />}
            </Table.Cell>
            <Table.Cell>
              {(permissions.can_administer_competition === '*' || permissions.can_administer_competition.includes(competition.id)) && (
                <>
                  <Popup
                    content="Add users to your feed"
                    trigger={(
                      <a href={competitionReportUrl(competition.id)}>
                        <Icon name="file alternate" />
                      </a>
                    )}
                  />

                  <a href={competitionReportEditUrl(competition.id)}>
                    <Icon name="edit" />
                  </a>
                </>
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </TableBody>
    </Table>
  );
}

export default function MyCompetitions() {
  const [isAccordionOpen, setIsAccordionOpen] = React.useState(false);
  const [shouldShowRegistrationStatus, setShouldShowRegistrationStatus] = React.useState(false);
  const competitions = [];
  const bookmarkedCompetitions = [];
  const permissions = {};
  return (
    <>
      <Header>
        {I18n.t('competitions.my_competitions.title')}
      </Header>
      <p>
        {I18n.t('competitions.my_competitions.disclaimer')}
      </p>
      <Accordion fluid styled>
        <Accordion.Title
          active={isAccordionOpen}
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
        >
          {I18n.t('competitions.my_competitions.past_competitions')}
        </Accordion.Title>
        <Accordion.Content active={isAccordionOpen}>
          {pastCompetitionsTable(competitions)}
        </Accordion.Content>
      </Accordion>
      <a href="https://staging.worldcubeassociation.org/persons/2012ICKL01">{I18n.t('layouts.navigation.my_results')}</a>
    </>
  );
}
