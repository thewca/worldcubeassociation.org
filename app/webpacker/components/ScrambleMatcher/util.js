import _ from 'lodash';
import { events } from '../../lib/wca-data.js.erb';

const prefixForIndex = (index) => {
  const char = String.fromCharCode(65 + (index % 26));
  if (index < 26) return char;

  return prefixForIndex(Math.floor(index / 26) - 1) + char;
};

export const scrambleSetToName = (scrambleSet) => `${events.byId[scrambleSet.event_id].name} Round ${scrambleSet.round_number} Scramble Set ${prefixForIndex(scrambleSet.scramble_set_number - 1)}`;

export const scrambleSetToDetails = (scrambleSet) => {
  const [extraScr, standardScr] = _.partition(scrambleSet.inbox_scrambles, 'is_extra');

  const stdScrambleList = standardScr.map((scr) => scr.scramble_string).join('\n');

  if (extraScr.length > 0) {
    const extraScrambleList = extraScr.map((scr) => scr.scramble_string).join('\n');

    return [stdScrambleList, extraScrambleList].join('\n\n');
  }

  return stdScrambleList;
};

export function moveArrayItem(arr, fromIndex, toIndex) {
  const movedItem = arr[fromIndex];

  const withoutMovedItem = [
    ...arr.slice(0, fromIndex),
    // here we want to ignore the moved item itself, so we need the +1
    ...arr.slice(fromIndex + 1),
  ];

  return [
    ...withoutMovedItem.slice(0, toIndex),
    movedItem,
    // here we do NOT want to ignore the items that were originally there, so no +1
    ...withoutMovedItem.slice(toIndex),
  ];
}
