import React from 'react';

import FmField from './FmField';
import MbldField from './MbldField';
import TimeField from './TimeField';

/**
   `AttemptResultField` is an abstraction over fields specific to the given event,
   but each of these specific fields works in the similar way.

   The idea behind an attempt result field is that it gets a `value`,
   allows editing it in any way (by keeping a local draft value)
   and triggers an `onChange` callback once editing is finished (a blur event).

   This requires keeping both the current value in the parent component (like
   for a controlled field) and a draft value in the field component
   (local copy of the upstream value).
   Whenever `value` changes we want to synchronize the local draft value,
   which fits into the `getDerivedStateFromProps` lifecycle method.
   The most straightforward solution would be using useEffect to keep them in sync,
   but this performs unnecessary re-rendering with old value and leads to jumpy UI.
   https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html
   The above article describes alternatives, but none seems good enough in our case:
   - keeping the draft value in the parent component (e.g. `ResultForm`) is a bad idea,
   because each field type stores the draft value in different format
   and it's just best to use the fields as isolated black boxes
   - using the key prop is a better option, but it remounts the given input element,
   which may lead to undesired *Tab* key behaviour
   (clicking *Tab* blurs one input, which may affect the next input value
   and remounting it as a consequence, in that case we lose focus)

   Using getDerivedStateFromProps sounds justified in this case.
   Hooks equivalent is described in the section below
   https://reactjs.org/docs/hooks-faq.html#how-do-i-implement-getderivedstatefromprops.
*/

/* eslint react/jsx-props-no-spreading: "off" */
function AttemptResultField({ eventId, ...props }) {
  if (eventId === '333fm') {
    return <FmField {...props} />;
  }
  if (eventId === '333mbf' || eventId === '333mbo') {
    return <MbldField {...props} />;
  }
  return <TimeField {...props} />;
}

export default AttemptResultField;
