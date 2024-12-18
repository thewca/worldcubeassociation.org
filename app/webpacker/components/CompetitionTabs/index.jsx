import React, { useMemo } from 'react';
import { Tab, TabPane } from 'semantic-ui-react';
import GeneralInfoTab from './GeneralInfo/GeneralInfoTab';
import CompetitionTab from './CompetitionTab';
import EventsTable from './EventsTable';
import Schedule from './Schedule';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import './style.scss';
import TimeLimitCutoffInfo from './TimeLimitCutoffInfo';
import I18n from '../../lib/i18n';

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
  tabs, competition, wcifEvents, wcifSchedule, locale, userInfo, records, winners, media,
}) {
  const panes = useMemo(() => {
    const p = [{
      slug: 'general-info',
      menuItem: I18n.t('competitions.show.general_info'),
      render: () => (
        <GeneralInfoTab
          competition={competition}
          userInfo={userInfo}
          records={records}
          winners={winners}
          media={media}
        />
      ),
    }];
    if (competition['has_rounds?']) {
      p.push({
        slug: 'competition-events',
        menuItem: I18n.t('competitions.show.events'),
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
        menuItem: I18n.t('competitions.show.schedule'),
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
  }, [competition, locale, media, records, tabs, userInfo, wcifEvents, wcifSchedule, winners]);

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
