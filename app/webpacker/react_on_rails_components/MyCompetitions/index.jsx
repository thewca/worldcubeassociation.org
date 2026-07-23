import React, { useState } from 'react';
import {
  Accordion,
  Header,
  Icon,
  Button,
  Divider,
} from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import {
  personUrl,
  competitionsUrl,
} from '../../lib/requests/routes.js.erb';
import UpcomingCompetitionTable from './UpcomingCompetitionTable';
import PastCompetitionsTable from './PastCompetitionTable';

export default function MyCompetitions({
  permissions,
  competitions,
  registrationStatuses,
  wcaId,
}) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  return (
    <>
      <Header>
        {wcaId && (
          <Button
            as="a"
            href={personUrl(wcaId)}
            secondary
            floated="right"
          >
            {I18n.t('layouts.navigation.my_results')}
          </Button>
        )}
        {I18n.t('competitions.my_competitions.title')}
      </Header>
      <p>
        {I18n.t('competitions.my_competitions.disclaimer')}
      </p>
      <UpcomingCompetitionTable
        competitions={competitions.future}
        permissions={permissions}
        registrationStatuses={registrationStatuses}
        fallbackMessage={{
          key: 'competitions.my_competitions_table.no_upcoming_competitions_html',
          options: { link: `<a href="${competitionsUrl({})}">${I18n.t('competitions.my_competitions_table.competitions_list')}</a>` },
        }}
      />
      <Accordion fluid styled>
        <Accordion.Title
          active={isAccordionOpen}
          onClick={() => setIsAccordionOpen((prevValue) => !prevValue)}
        >
          {`${I18n.t('competitions.my_competitions.past_competitions')} (${competitions.past.length ?? 0})`}
        </Accordion.Title>
        <Accordion.Content active={isAccordionOpen}>
          <PastCompetitionsTable
            permissions={permissions}
            competitions={competitions.past}
            fallbackMessage={{ key: 'competitions.my_competitions_table.no_past_competitions' }}
          />
        </Accordion.Content>
      </Accordion>
      <Divider />
      <Header>
        <Icon name="bookmark" />
        {I18n.t('competitions.my_competitions.bookmarked_title')}
      </Header>
      <p>{I18n.t('competitions.my_competitions.bookmarked_explanation')}</p>
      <UpcomingCompetitionTable
        competitions={competitions.bookmarked}
        registrationStatuses={registrationStatuses}
        permissions={permissions}
        fallbackMessage={{ key: 'competitions.my_competitions_table.no_bookmarked_competitions' }}
      />
    </>
  );
}
