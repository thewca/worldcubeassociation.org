import { generateWcifRound, isRoundParticipationTarget, removeSharedTimeLimits } from '../utils';
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
import { formats } from '../../../lib/wca-data.js.erb';
import { buildActivityCode, parseActivityCode } from '../../../lib/utils/wcif';

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

const upcycleAdvancementCondition = (advCondition, round) => {
  const formatInfo = formats.byId[round.format];
  const sortingScope = formatInfo.sortBy;

  return {
    type: advCondition.type.replace('attemptResult', 'resultAchieved'),
    scope: sortingScope,
    value: advCondition.level,
  };
};

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
    ));

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
          cumulativeRoundIds: round.timeLimit.cumulativeRoundIds.filter((roundId) => ![
            payload.roundId,
            ...payload.timeLimit.cumulativeRoundIds,
          ].includes(roundId)),
        },
      } : {}),
    );

    // then, add the (potential) new shared cumulative time limit to _all involved rounds_
    return {
      ...state,
      wcifEvents: updateForRounds(
        eventsWithRoundsRemovedFromCumulativeTimeLimits,
        [payload.roundId, ...payload.timeLimit.cumulativeRoundIds],
        () => ({ timeLimit: payload.timeLimit }),
      ),
    };
  },

  [UpdateAdvancementCondition]: (state, { payload }) => {
    const { roundId, advancementCondition } = payload;
    const { eventId, roundNumber } = parseActivityCode(roundId);

    const currentEvent = state.wcifEvents.find((evt) => evt.id === eventId);

    if (advancementCondition.type === 'dual') {
      const currentRound = currentEvent.rounds.find((rd) => rd.id === roundId);

      // By convention of this UI, the condition 'dual' means to merge this round
      //   and the next round (N + 1) into one common linkedRound
      const linkedSiblingId = buildActivityCode({ eventId, roundNumber: roundNumber + 1 });

      const alreadyLinked = currentRound.linkedRounds ?? [roundId];
      const idsInLink = [...alreadyLinked, linkedSiblingId];

      const existingLinkSource = currentRound.participationRuleset.participationSource;

      const eventsWithLinked = updateForRounds(state.wcifEvents, idsInLink, (rd) => ({
        linkedRounds: idsInLink,
        participationRuleset: {
          ...rd.participationRuleset,
          participationSource: existingLinkSource,
        },
      }));

      const pointingToLast = currentEvent.rounds.filter(
        (rd) => isRoundParticipationTarget(rd, linkedSiblingId),
      ).map((rd) => rd.id);

      return ({
        ...state,
        wcifEvents: updateForRounds(eventsWithLinked, pointingToLast, (rd) => ({
          participationRuleset: {
            ...rd.participationRuleset,
            participationSource: {
              type: 'linkedRounds',
              roundIds: idsInLink,
              resultCondition: rd.participationRuleset.participationSource.resultCondition,
            },
          },
        })),
      });
    }

    const updateRoundIds = currentEvent.rounds
      .filter((rd) => isRoundParticipationTarget(rd, roundId))
      .map((rd) => rd.id);

    return ({
      ...state,
      wcifEvents: updateForRounds(state.wcifEvents, updateRoundIds, (rd) => ({
        participationRuleset: {
          ...rd.participationRuleset,
          participationSource: {
            ...rd.participationRuleset.participationSource,
            resultCondition: upcycleAdvancementCondition(advancementCondition, rd),
          },
        },
      })),
    });
  },

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
