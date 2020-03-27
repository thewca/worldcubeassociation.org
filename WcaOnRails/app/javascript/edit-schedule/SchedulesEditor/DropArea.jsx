import React from 'react';

export const dropAreaSelector = '#drop-event-area';

export const DropArea = () => (
  <div id="drop-event-area" className="bg-danger text-danger text-center">
    <i className="fas fa-trash fa-lg pull-left" />
    Drop an event here to remove it from the schedule.
    <i className="fas fa-trash fa-lg pull-right" />
  </div>
);

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
