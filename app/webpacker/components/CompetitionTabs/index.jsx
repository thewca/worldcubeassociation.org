import React, { useMemo } from 'react';
import { Tab, TabPane } from 'semantic-ui-react';
import GeneralInfoTab from './GeneralInfoTab';
import CompetitionTab from './CompetitionTab';
import EventsTable from './EventsTable';
import Schedule from './Schedule';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import './style.css';
import TimeLimitCutoffInfo from './TimeLimitCutoffInfo';

const updatePath = (tabSlug) => {
  window.history.replaceState({}, '', `${window.location.pathname}#${tabSlug}`);
};

const getSlugFromPath = () => {
  if (window.location.hash) {
    return window.location.hash.substring(1);
  }
  return null;
};

const tabIndexFromSlug = (panes) => {
  const pathSlug = getSlugFromPath();
  if (!pathSlug) {
    return 0;
  }
  return panes.findIndex((p) => p.slug === pathSlug);
};

export default function Wrapper({
  tabs, competition, wcifEvents, wcifSchedule, locale, userInfo,
}) {
  const panes = useMemo(() => {
    const p = [{ slug: 'general-info', menuItem: 'General Info', render: () => <GeneralInfoTab competition={competition} userInfo={userInfo} /> }];
    if (competition['has_rounds?']) {
      p.push({
        slug: 'competition-events',
        menuItem: 'Events',
        render: () => (
          <TabPane>
            <EventsTable competitionInfo={competition} wcifEvents={wcifEvents} />
            <br />
            <TimeLimitCutoffInfo competition={competition} />
          </TabPane>
        ),
      });
    }
    if (competition['has_schedule?']) {
      p.push({
        slug: 'competition-schedule',
        menuItem: 'Schedule',
        render: () => (
          <TabPane>
            <Schedule
              wcifEvents={wcifEvents}
              wcifSchedule={wcifSchedule}
              calendarLocale={locale}
              competitionName={competition.name}
            />
            <br />
            <TimeLimitCutoffInfo competition={competition} />
          </TabPane>
        ),
      });
    }
    tabs.map((tab) => p.push({ slug: `${tab.id}-${_.kebabCase(tab.name)}`, menuItem: tab.name, render: () => <CompetitionTab tab={tab} /> }));
    return p;
  }, [competition, locale, tabs, userInfo, wcifEvents, wcifSchedule]);

  return (
    <WCAQueryClientProvider>
      <Tab
        defaultActiveIndex={tabIndexFromSlug(panes)}
        panes={panes}
        menu={{ pointing: true, className: 'tab-wrapped' }}
        onTabChange={(_, { activeIndex }) => {
          const tab = panes[activeIndex];
          updatePath(tab.slug);
        }}
      />
    </WCAQueryClientProvider>
  );
}
