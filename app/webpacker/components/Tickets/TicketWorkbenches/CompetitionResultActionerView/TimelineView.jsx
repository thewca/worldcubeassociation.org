import React, { useMemo } from 'react';
import { Icon, Popup, Step } from 'semantic-ui-react';
import _ from 'lodash';
import { TIMELINE_ORDER, TIMELINE_STATUSES } from './TimelineStatuses';

export default function TimelineView({ nextStatus }) {
  const nextStatusIndex = useMemo(
    () => {
      if (nextStatus === null) return TIMELINE_ORDER.length;
      return TIMELINE_ORDER.indexOf(nextStatus);
    },
    [nextStatus],
  );

  return (
    <Step.Group ordered>
      {TIMELINE_ORDER.map((timelineStatus, timelineStatusIndex) => (
        <Step
          key={timelineStatus}
          completed={timelineStatusIndex < nextStatusIndex}
          active={timelineStatusIndex === nextStatusIndex}
        >
          <Step.Content>
            <Step.Title>
              {TIMELINE_STATUSES[timelineStatus].label || _.startCase(timelineStatus)}
              <Popup
                trigger={<Icon name="info circle" size="large" />}
                content={TIMELINE_STATUSES[timelineStatus].description}
              />
            </Step.Title>
          </Step.Content>
        </Step>
      ))}
    </Step.Group>
  );
}
