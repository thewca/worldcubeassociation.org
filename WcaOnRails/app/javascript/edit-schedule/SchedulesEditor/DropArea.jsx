import React from 'react'

export const dropAreaSelector = "#drop-event-area";

export const DropArea = () => (
  <div id="drop-event-area" className="bg-danger text-danger text-center">
    <i className="fa fa-trash pull-left"></i>
    Drop an event here to remove it from the schedule.
    <i className="fa fa-trash pull-right"></i>
  </div>
);

export function isEventOverDropArea(jsEvent) {
  let trashElem = $(dropAreaSelector);

  // Base trash position
  let trashPosition = trashElem.offset();

  // Fix the trash position with vertical scroll
  let scrolled = $(window).scrollTop();
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
    $(dropAreaSelector).addClass("event-on-top");
  } else {
    $(dropAreaSelector).removeClass("event-on-top");
  }
}

