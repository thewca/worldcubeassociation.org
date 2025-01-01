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

export default function MyCompetitions({ permissions, competitions, wcaId }) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  return (
    <>
      <Header>
        {I18n.t('competitions.my_competitions.title')}
      </Header>
      <p>
        {I18n.t('competitions.my_competitions.disclaimer')}
      </p>
      <UpcomingCompetitionTable
        competitions={competitions.futureCompetitions}
        permissions={permissions}
        registrationStatuses={competitions.competingStatuses}
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
          {`${I18n.t('competitions.my_competitions.past_competitions')} (${competitions.pastCompetitions?.length ?? 0})`}
        </Accordion.Title>
        <Accordion.Content active={isAccordionOpen}>
          <PastCompetitionsTable
            permissions={permissions}
            competitions={competitions.pastCompetitions}
            fallbackMessage={{ key: 'competitions.my_competitions_table.no_past_competitions' }}
          />
        </Accordion.Content>
      </Accordion>
      <Divider />
      <Button as="a" href={personUrl(wcaId)}>{I18n.t('layouts.navigation.my_results')}</Button>
      <Header>
        <Icon name="bookmark" />
        {I18n.t('competitions.my_competitions.bookmarked_title')}
      </Header>
      <p>{I18n.t('competitions.my_competitions.bookmarked_explanation')}</p>
      <UpcomingCompetitionTable
        competitions={competitions.bookmarkedCompetitions}
        registrationStatuses={competitions.competingStatuses}
        permissions={permissions}
        fallbackMessage={{ key: 'competitions.my_competitions_table.no_bookmarked_competitions' }}
      />
    </>
  );
}
