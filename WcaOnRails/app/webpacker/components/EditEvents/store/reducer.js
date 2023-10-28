import { generateWcifRound, removeSharedTimeLimits } from '../utils';
import {
  AddEvent,
  AddRounds,
  ChangesSaved,
  RemoveEvent,
  RemoveRounds,
  SetScrambleSetCount,
  UpdateRoundFormat,
  UpdateAdvancementCondition,
  UpdateCutoff,
  UpdateQualification,
  UpdateTimeLimit,
} from './actions';

/**
 * Updates 1 or more rounds
 * @param {Event[]} wcifEvents
 * @param {ActivityCode[]} roundIds
 * @param {function(Round): Partial<Round>} mapper
 * @returns {Event[]}
 */
const updateForRounds = (wcifEvents, roundIds, mapper) => wcifEvents.map((event) => ({
  ...event,
  rounds: event?.rounds?.length
    ? event.rounds.map((round) => (roundIds.includes(round.id) ? {
      ...round,
      ...mapper(round),
    } : round)) : event.rounds,
}));

const reducers = {
  [ChangesSaved]: (state) => ({
    ...state,
    initialWcifEvents: state.wcifEvents,
  }),

  [AddEvent]: (state, { payload }) => ({
    ...state,
    wcifEvents: state.wcifEvents.map((event) => (event.id === payload.eventId ? ({
      ...event,
      rounds: [],
    }) : event)),
  }),

  [RemoveEvent]: (state, { payload }) => {
    const { eventId } = payload;
    const event = state.wcifEvents.find((e) => e.id === eventId);
    const roundIdsToRemove = event.rounds.map((round) => round.id);

    return {
      ...state,
      wcifEvents: state.wcifEvents.map((e) => (e.id === payload.eventId ? ({
        id: e.id,
        rounds: null,
      }) : removeSharedTimeLimits(e, roundIdsToRemove))),
    };
  },

  [AddRounds]: (state, { payload }) => {
    const { eventId, roundsToAddCount } = payload;
    const event = state.wcifEvents.find((e) => e.id === eventId);
    const existingRounds = event.rounds ?? [];
    const newRounds = Array(roundsToAddCount).fill(null).map((_, i) => (
      generateWcifRound(eventId, existingRounds.length + i + 1)
    ))

    return {
      ...state,
      wcifEvents: state.wcifEvents.map((e) => (e.id === eventId ? ({
        ...e, rounds: [...existingRounds, ...newRounds],
      }) : e)),
    };
  },

  [RemoveRounds]: (state, { payload }) => {
    const { eventId, roundsToRemoveCount } = payload;
    const event = state.wcifEvents.find((e) => e.id === eventId);

    // For removing shared cumulative time limits from other rounds
    const roundIdsToRemove = event.rounds.slice(event.rounds.length - roundsToRemoveCount)
      .map((round) => round.id);

    // Creating a copy because otherwise, we would be mutating a reference that points to
    // our reducer's state (and if you just only openend the page, also to the initialWcif state!)
    const newEvent = {
      ...event,
      rounds: event.rounds.slice(0, event.rounds.length - roundsToRemoveCount),
    };

    if (newEvent.rounds.length > 0) {
      // Final rounds must not have an advance to next round requirement.
      newEvent.rounds[newEvent.rounds.length - 1].advancementCondition = null;
    }

    return {
      ...state,
      wcifEvents: state.wcifEvents.map((e) => (
        e.id === eventId ? newEvent : removeSharedTimeLimits(e, roundIdsToRemove)
      )),
    };
  },

  [UpdateRoundFormat]: (state, { payload }) => ({
    ...state,
    wcifEvents: updateForRounds(state.wcifEvents, [payload.roundId], () => ({
      format: payload.format,
    })),
  }),

  [SetScrambleSetCount]: (state, { payload }) => ({
    ...state,
    wcifEvents: updateForRounds(state.wcifEvents, [payload.roundId], () => ({
      scrambleSetCount: payload.scrambleSetCount,
    })),
  }),

  [UpdateCutoff]: (state, { payload }) => ({
    ...state,
    wcifEvents: updateForRounds(state.wcifEvents, [payload.roundId], () => ({
      cutoff: payload.cutoff,
    })),
  }),

  [UpdateTimeLimit]: (state, { payload }) => {
    // payload may have a new group of round ids to share a cumulative time limit;
    // if not, it itself may have formerly been in a cumulative time limit
    // so first, remove all those rounds (or the round itself) from _all_ cumulative time limits
    const eventsWithRoundsRemovedFromCumulativeTimeLimits = updateForRounds(
      state.wcifEvents,
      state.wcifEvents.flatMap((event) => event.rounds?.map((round) => round.id) ?? []),
      (round) => (round.timeLimit?.cumulativeRoundIds ? {
        timeLimit: {
          ...round.timeLimit,
          cumulativeRoundIds: round.timeLimit.cumulativeRoundIds.filter(
            (roundId) => ![payload.roundId, ...payload.timeLimit.cumulativeRoundIds].includes(roundId)
          ),
        },
      } : {})
    );
    // then, add the (potential) new shared cumulative time limit to _all involved rounds_
    return {
      ...state,
      wcifEvents: updateForRounds(
        eventsWithRoundsRemovedFromCumulativeTimeLimits,
        [payload.roundId, ...payload.timeLimit.cumulativeRoundIds],
        () => ({ timeLimit: payload.timeLimit }),
      ),
    }
  },

  [UpdateAdvancementCondition]: (state, { payload }) => ({
    ...state,
    wcifEvents: updateForRounds(state.wcifEvents, [payload.roundId], () => ({
      advancementCondition: payload.advancementCondition,
    })),
  }),

  [UpdateQualification]: (state, { payload }) => ({
    ...state,
    wcifEvents: state.wcifEvents.map((event) => (event.id === payload.eventId ? ({
      ...event,
      qualification: payload.qualification,
    }) : event)),
  }),
};

export default function rootReducer(state, action) {
  const reducer = reducers[action.type];
  if (reducer) {
    return reducer(state, action);
  }
  return state;
}
