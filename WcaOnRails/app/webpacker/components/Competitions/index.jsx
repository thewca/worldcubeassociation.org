import React from 'react';
import {
  Accordion,
  Header,
  Icon,
  Table,
  TableBody,
  TableHeader,
  Popup,
  Checkbox,
} from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import {
  competitionReportEditUrl,
  competitionReportUrl,
  myCompetitionsAPIUrl,
  personUrl,
  meAPIUrl,
  permissionsAPIUrl,
  editCompetitionsUrl,
  competitionRegistrationsUrl,
} from '../../lib/requests/routes.js.erb';
import useLoadedData from '../../lib/hooks/useLoadedData';
import Loading from '../Requests/Loading';

function UpcomingCompetitionTable({ competitions, permissions }) {
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
              Icon
            </Table.Cell>
            <Table.Cell>
              <a href={editCompetitionsUrl(competition.id)}>
                { I18n.t('competitions.my_competitions_table.edit') }
              </a>
            </Table.Cell>
            <Table.Cell>
              <a href={competitionRegistrationsUrl(competition.id)}>
                { I18n.t('competitions.my_competitions_table.edit_report') }
              </a>
            </Table.Cell>
            <Table.Cell>
              {(permissions.can_administer_competition === '*' || permissions.can_administer_competition.includes(competition.id)) && (
                <>
                  <Popup
                    content="View the Delegate Report"
                    trigger={(
                      <a href={competitionReportUrl(competition.id)}>
                        <Icon name="file alternate" />
                      </a>
                    )}
                  />
                  <Popup
                    content="Edit the Report"
                    trigger={(
                      <a href={competitionReportEditUrl(competition.id)}>
                        <Icon name="edit" />
                      </a>
                    )}
                  />
                </>
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </TableBody>
    </Table>
  );
}

function PastCompetitionsTable({ competitions, permissions }) {
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
                    content="View the Delegate Report"
                    trigger={(
                      <a href={competitionReportUrl(competition.id)}>
                        <Icon name="file alternate" />
                      </a>
                    )}
                  />
                  <Popup
                    content="Edit the Report"
                    trigger={(
                      <a href={competitionReportEditUrl(competition.id)}>
                        <Icon name="edit" />
                      </a>
                    )}
                  />
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
  const { data: competitions, loading: competitionsLoading } = useLoadedData(myCompetitionsAPIUrl);
  const { data: me, loading: meLoading } = useLoadedData(meAPIUrl);
  const { data: permissions, loading: permissionsLoading } = useLoadedData(permissionsAPIUrl);
  return (
    (meLoading || competitionsLoading || permissionsLoading) ? <Loading /> : (
      <>
        <Header>
          {I18n.t('competitions.my_competitions.title')}
        </Header>
        <p>
          {I18n.t('competitions.my_competitions.disclaimer')}
        </p>
        <UpcomingCompetitionTable competitions={competitions} permissions={permissions} />
        <Accordion fluid styled>
          <Accordion.Title
            active={isAccordionOpen}
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          >
            {I18n.t('competitions.my_competitions.past_competitions')}
          </Accordion.Title>
          <Accordion.Content active={isAccordionOpen}>
            <PastCompetitionsTable
              competitions={competitions.past_competitions}
              permissions={permissions}
            />
          </Accordion.Content>
        </Accordion>
        <a href={personUrl(me.wca_id)}>{I18n.t('layouts.navigation.my_results')}</a>
        <Header icon="bookmark">
          {I18n.t('competitions.my_competitions.bookmarked_title')}
        </Header>
        <p>{I18n.t('competitions.my_competitions.bookmarked_explanation')}</p>
        <Checkbox
          checked={shouldShowRegistrationStatus}
          label={I18n.t('competitions.index.show_registration_status')}
          onChange={() => setShouldShowRegistrationStatus(!shouldShowRegistrationStatus)}
        />
        <UpcomingCompetitionTable
          competitions={competitions.bookmarked_competitions}
          permissions={permissions}
        />
      </>
    )
  );
}
