import React from 'react';
import { DateTime } from 'luxon';

export function dayDifferenceFromToday(yyyymmddDateString) {
  const dateLuxon = DateTime.fromFormat(yyyymmddDateString, 'yyyy-MM-dd');
  const exactDaysDiff = dateLuxon.diffNow('days').days;

  if (dateLuxon > DateTime.now()) {
    return Math.ceil(exactDaysDiff);
  }

  return Math.floor(exactDaysDiff * -1);
}

// Currently, the venue attribute of a competition object can be written as markdown,
// and using third party libraries like react-markdown to parse it requires too much work
export function PseudoLinkMarkdown({ text }) {
  const openBracketIndex = text.indexOf('[');
  const closeBracketIndex = text.indexOf(']', openBracketIndex);
  const openParenIndex = text.indexOf('(', closeBracketIndex);
  const closeParenIndex = text.indexOf(')', openParenIndex);

  if (openBracketIndex === -1 || closeBracketIndex === -1
    || openParenIndex === -1 || closeParenIndex === -1) {
    return <p>{text}</p>;
  }

  return (
    <p>
      <a href={text.slice(openParenIndex + 1, closeParenIndex)} target="_blank" rel="noreferrer">
        {text.slice(openBracketIndex + 1, closeBracketIndex)}
      </a>
    </p>
  );
}
