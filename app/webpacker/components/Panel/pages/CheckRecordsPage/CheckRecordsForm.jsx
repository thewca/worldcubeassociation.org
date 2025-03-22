import React, { useState } from 'react';
import { Button, Form } from 'semantic-ui-react';
import { IdWcaSearch } from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import EventSelector from '../../../wca/EventSelector';
import { events } from '../../../../lib/wca-data.js.erb';
import { viewUrls } from '../../../../lib/requests/routes.js.erb';
import useInputState from '../../../../lib/hooks/useInputState';
import useCheckboxState from '../../../../lib/hooks/useCheckboxState';
import useQueryParams from '../../../../lib/hooks/useQueryParams';

const ALL_EVENTS = events.all.map((event) => event.id);
const ALL_EVENTS_KEY = 'all';

export default function CheckRecordsForm() {
  const [queryParams] = useQueryParams();
  const [eventId, setEventId] = useState(queryParams?.event_id || ALL_EVENTS_KEY);
  const [competitionId, setCompetitionId] = useInputState(queryParams?.competition_id);
  const [refreshIndex, setRefreshIndex] = useCheckboxState(false);

  return (
    <Form>
      <Form.Field
        label="Competition ID"
        control={IdWcaSearch}
        name="competitionId"
        value={competitionId}
        onChange={setCompetitionId}
        model={SEARCH_MODELS.competition}
        required
        multiple={false}
      />
      <p>Leave blank to check for all competitions</p>
      <EventSelector
        eventList={ALL_EVENTS}
        selectedEvents={eventId === ALL_EVENTS_KEY ? ALL_EVENTS : [eventId]}
        onAllClick={() => setEventId(ALL_EVENTS_KEY)}
        onEventClick={setEventId}
        hideClearButton
      />
      <Form.Checkbox
        required
        label="Refresh index for selected competition(s)"
        checked={refreshIndex}
        onChange={setRefreshIndex}
      />
      <p>
        This will attempt to compute the lookup on-the-fly only if a specific competition
        has been selected above. It can lead to timeouts, please rely on CAD when that happens.
      </p>
      <Button
        content="Run check"
        href={viewUrls.admin.overrideRegionalRecords(competitionId, eventId, refreshIndex)}
      />
    </Form>
  );
}
