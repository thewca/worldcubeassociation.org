import React from 'react';

const loadDnd = () => import(/* webpackChunkName: "hello-pangea-dnd" */ '@hello-pangea/dnd');

export const DragDropContext = React.lazy(
  () => loadDnd().then((m) => ({ default: m.DragDropContext })),
);
export const Droppable = React.lazy(
  () => loadDnd().then((m) => ({ default: m.Droppable })),
);
export const Draggable = React.lazy(
  () => loadDnd().then((m) => ({ default: m.Draggable })),
);
