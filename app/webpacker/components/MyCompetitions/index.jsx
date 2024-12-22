import React, { useState } from 'react';
import {
  Accordion,
  Header,
  Icon,
  Checkbox, Segment, Button, Divider,
} from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import {
  personUrl,
} from '../../lib/requests/routes.js.erb';
import UpcomingCompetitionTable from './UpcomingCompetitionTable';
import PastCompetitionsTable from './PastCompetitionTable';
import useCheckboxState from '../../lib/hooks/useCheckboxState';

export default function MyCompetitions({ permissions, competitions, wcaId }) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [shouldShowRegistrationStatus, setShouldShowRegistrationStatus] = useCheckboxState(false);

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
        registrationStatuses={competitions.registrationStatuses}
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
      <Checkbox
        checked={shouldShowRegistrationStatus}
        label={I18n.t('competitions.index.show_registration_status')}
        onChange={setShouldShowRegistrationStatus}
      />
      <UpcomingCompetitionTable
        competitions={competitions.bookmarkedCompetitions}
        registrationStatuses={competitions.registrationStatuses}
        shouldShowRegistrationStatus={shouldShowRegistrationStatus}
        permissions={permissions}
      />
    </>
  );
}
