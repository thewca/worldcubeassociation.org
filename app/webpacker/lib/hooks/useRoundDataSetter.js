import { useCallback } from 'react';
import _ from 'lodash';
import useNestedInputUpdater from './useNestedInputUpdater';

// Highly specific hook for the transition from round_type_id to round_id.
// A little bit documented here and there, but in case of doubt ask Gregor.
const useRoundDataSetter = (updater, path, currentRoundState, availableRoundData) => {
  const setDataRaw = useNestedInputUpdater(updater, path);
  const setRoundId = useNestedInputUpdater(updater, 'roundId');

  return useCallback((ev, data = undefined) => {
    const previousRoundState = { ...currentRoundState };
    const innerValue = setDataRaw(ev, data);

    // use the round from before to construct information about the new, desired state
    _.set(previousRoundState, path, innerValue);

    // find the rounds that are available for the desired, user-selected event
    const nextAvailableRounds = availableRoundData[previousRoundState.eventId].rounds;

    // find the round within the event that matches the user-selected criteria
    const nextRound = nextAvailableRounds.find(
      (r) => r.roundTypeId === previousRoundState.roundTypeId
        && r.formatId === previousRoundState.formatId,
    );

    // It can happen that we haven't found a round. Say the second round is Mo3
    //   and the final is Bo1. The user would have to independently change *both* dropdowns
    //   one after another, and in between it would temporarily result in an invalid state.
    // We do have backend validations in place to make sure such an invalid intermediate state
    //   is not persisted to the database when trying to be submitted.
    setRoundId(nextRound?.roundId);
  }, [path, currentRoundState, availableRoundData, setDataRaw, setRoundId]);
};

export default useRoundDataSetter;
