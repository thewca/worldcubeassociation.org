import { useCallback } from 'react';
import _ from 'lodash';
import useNestedInputUpdater from './useNestedInputUpdater';

// Highly specific hook for the transition from round_type_id to round_id.
// A little bit documented here and there, but in case of doubt ask Gregor.
const useRoundDataSetter = (updater, path, currentRoundId, availableRoundData) => {
  const setDataRaw = useNestedInputUpdater(updater, path);
  const setRoundId = useNestedInputUpdater(updater, 'roundId');

  return useCallback((ev, data = undefined) => {
    const innerValue = setDataRaw(ev, data);

    // If we haven't linked any round data yet, there's no need to try and re-link
    if (!currentRoundId) return;

    // find the event which contains the round we have currently stored
    const [currentEventId, availableRounds] = Object.entries(availableRoundData)
      .find(([, roundsData]) => roundsData.rounds.some((r) => r.roundId === currentRoundId));

    const currentRound = availableRounds.rounds.find((r) => r.roundId === currentRoundId);

    // use the round you found to construct information about the new, desired state
    const filterCriteria = { ...currentRound, eventId: currentEventId };
    _.set(filterCriteria, path, innerValue);

    // find the next round that matches the desired, user-selected criteria
    const nextAvailableRounds = availableRoundData[filterCriteria.eventId].rounds
      .map((r) => ({ ...r, eventId: currentEventId }));

    const nextRound = nextAvailableRounds.find(
      (r) => Object.entries(r).every(
        ([rKey, rValue]) => rKey === 'roundId' || filterCriteria[rKey] === rValue,
      ),
    );

    // It can happen that we haven't found a round. Say the second round is Mo3
    //   and the final is Bo1. The user would have to independently change *both* dropdowns
    //   one after another, and in between it would temporarily result in an invalid state.
    // We do have backend validations in place to make sure such an invalid intermediate state
    //   is not persisted to the database when trying to be submitted.
    setRoundId(nextRound?.roundId);
  }, [path, currentRoundId, availableRoundData, setDataRaw, setRoundId]);
};

export default useRoundDataSetter;
