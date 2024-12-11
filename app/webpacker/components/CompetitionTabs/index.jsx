import React, { useMemo } from 'react';
import { Tab, TabPane } from 'semantic-ui-react';
import GeneralInfoTab from './GeneralInfoTab';
import CompetitionTab from './CompetitionTab';
import EventsTable from './EventsTable';
import Schedule from './Schedule';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import './style.css';

export default function Wrapper({
  tabs, competition, wcifEvents, wcifSchedule, locale,
}) {
  const panes = useMemo(() => {
    const p = [{ menuItem: 'General Info', render: () => <GeneralInfoTab competition={competition} /> }];
    if (competition['has_rounds?']) {
      p.push({
        menuItem: 'Events',
        render: () => (
          <TabPane>
            <EventsTable competitionInfo={competition} wcifEvents={wcifEvents} />
          </TabPane>
        ),
      });
    }
    if (competition['has_schedule?']) {
      p.push({
        menuItem: 'Schedule',
        render: () => (
          <TabPane>
            <Schedule
              wcifEvents={wcifEvents}
              wcifSchedule={wcifSchedule}
              calendarLocale={locale}
              competitionName={competition.name}
            />
          </TabPane>
        ),
      });
    }
    tabs.map((tab) => p.push({ menuItem: tab.name, render: () => <CompetitionTab tab={tab} /> }));
    return p;
  }, [competition, locale, tabs, wcifEvents, wcifSchedule]);
  return (
    <WCAQueryClientProvider>
      <Tab panes={panes} menu={{ pointing: true, className: 'tab-wrapped' }} />
    </WCAQueryClientProvider>
  );
}
