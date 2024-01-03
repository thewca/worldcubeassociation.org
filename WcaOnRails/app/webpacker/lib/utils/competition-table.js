import React from 'react';

export function calculateDayDifference(startDateString, endDateString, mode) {
  const dateToday = new Date();
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  const msInADay = 1000 * 3600 * 24;

  if (mode === 'future') {
    const msDifference = startDate.getTime() - dateToday.getTime();
    const dayDifference = Math.ceil(msDifference / msInADay);
    return dayDifference;
  }
  if (mode === 'past') {
    const msDifference = dateToday.getTime() - endDate.getTime();
    const dayDifference = Math.floor(msDifference / msInADay);
    return dayDifference;
  }

  return -1;
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
    <a href={text.slice(openParenIndex + 1, closeParenIndex)} target="_blank" rel="noreferrer">
      <p>{text.slice(openBracketIndex + 1, closeBracketIndex)}</p>
    </a>
  );
}
