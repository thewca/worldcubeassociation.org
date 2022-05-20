import React from 'react';
import { Icon } from 'semantic-ui-react';

export const dropAreaSelector = '#drop-event-area';

export function DropArea() {
  return (
    <div id="drop-event-area" className="bg-danger text-danger text-center">
      <Icon className="pull-left" name="trash" />
      Drop an event here to remove it from the schedule.
      <Icon className="pull-right" name="trash" />
    </div>
  );
}

export function isEventOverDropArea(jsEvent) {
  const trashElem = $(dropAreaSelector);

  // Base trash position
  const trashPosition = trashElem.offset();

  // Fix the trash position with vertical scroll
  const scrolled = $(window).scrollTop();
  trashPosition.top -= scrolled;

  // Compute remaining coordinates
  trashPosition.right = trashPosition.left + trashElem.width();
  trashPosition.bottom = trashPosition.top + trashElem.height();

  return jsEvent.clientX >= trashPosition.left
           && jsEvent.clientX <= trashPosition.right
           && jsEvent.clientY >= trashPosition.top
           && jsEvent.clientY <= trashPosition.bottom;
}

export function dropAreaMouseMoveHandler(jsEvent) {
  if (isEventOverDropArea(jsEvent)) {
    $(dropAreaSelector).addClass('event-on-top');
  } else {
    $(dropAreaSelector).removeClass('event-on-top');
  }
}
