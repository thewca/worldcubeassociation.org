import React from 'react';

import AttemptResultInput from './AttemptResultInput';
import { matchResult } from '../../lib/utils/edit-events';
import { roundIdToString } from '../../lib/utils/wcif';

const MIN_ADVANCE_PERCENT = 1;
const MAX_ADVANCE_PERCENT = 75;

/**
 * Formats an advancement requirement as a string
 * @param {String} advancementCondition
 * @returns
 */
function advanceReqToStr(eventId, advancementCondition) {
  if (!advancementCondition) {
    return '-';
  }

  switch (advancementCondition.type) {
    case 'ranking':
      return `Top ${advancementCondition.level}`;
    case 'percent':
      return `Top ${advancementCondition.level}%`;
    case 'attemptResult':
      return matchResult(advancementCondition.level, eventId, {
        short: true,
      });
    default:
      throw new Error(
        `Unrecognized advancementCondition type: ${advancementCondition.type}`,
      );
  }
}

export default {
  Title({ wcifRound }) {
    return (
      <span>
        Requirement to advance past
        {' '}
        {roundIdToString(wcifRound.id)}
      </span>
    );
  },
  Show({ value: advancementCondition, wcifEvent }) {
    return <span>{advanceReqToStr(wcifEvent.id, advancementCondition)}</span>;
  },
  Input({
    value: advancementCondition,
    onChange,
    autoFocus,
    roundNumber,
    wcifEvent,
  }) {
    let typeInput;
    const inputByType = {};
    const onChangeAggregator = () => {
      const type = typeInput.value;
      const defaultValue = { percent: 75, ranking: 0, attemptResult: 0 }[type];
      let newAdvancementCondition = null;
      if (type !== '') {
        const input = inputByType[type];
        newAdvancementCondition = {
          type,
          level: input ? parseInt(input.value, 10) : defaultValue,
        };
      }
      onChange(newAdvancementCondition);
    };

    let advancementInput = null;
    let helpBlock = null;
    const advancementType = advancementCondition ? advancementCondition.type : '';
    let valueLabel = null;
    switch (advancementType) {
      case 'ranking':
        valueLabel = 'Ranking';
        advancementInput = (
          <input
            type="number"
            id="advacement-condition-value"
            className="form-control"
            value={advancementCondition.level}
            onChange={onChangeAggregator}
            ref={(c) => {
              inputByType.ranking = c;
            }}
          />
        );
        helpBlock = `The top ${
          advancementCondition.level
        } competitors from round ${roundNumber} will advance to round ${
          roundNumber + 1
        }.`;
        break;
      case 'percent':
        valueLabel = 'Percent';
        advancementInput = (
          <input
            type="number"
            id="advacement-condition-value"
            min={MIN_ADVANCE_PERCENT}
            max={MAX_ADVANCE_PERCENT}
            className="form-control"
            value={advancementCondition.level}
            onChange={onChangeAggregator}
            ref={(c) => {
              inputByType.percent = c;
            }}
          />
        );
        helpBlock = `The top ${
          advancementCondition.level
        }% of competitors from round ${roundNumber} will advance to round ${
          roundNumber + 1
        }.`;
        break;
      case 'attemptResult':
        valueLabel = 'Result';
        advancementInput = (
          <AttemptResultInput
            id="advacement-condition-value"
            eventId={wcifEvent.id}
            value={advancementCondition.level}
            onChange={onChangeAggregator}
            ref={(c) => {
              inputByType.attemptResult = c;
            }}
          />
        );
        helpBlock = `Everyone in round ${roundNumber} with a result ${matchResult(
          advancementCondition.level,
          wcifEvent.id,
        )} will advance to round ${roundNumber + 1}.`;
        break;
      default:
        advancementInput = null;
        break;
    }

    return (
      <div>
        <div className="form-group">
          <label
            htmlFor="advacement-condition-type"
            className="col-sm-3 control-label"
          >
            Type
          </label>
          <div className="col-sm-9">
            <select
              value={advancementCondition ? advancementCondition.type : ''}
              id="advacement-condition-type"
              name="type"
              autoFocus={autoFocus}
              onChange={onChangeAggregator}
              className="form-control"
              ref={(c) => {
                typeInput = c;
              }}
            >
              <option value="">To be announced</option>
              <option disabled="disabled">────────</option>
              <option value="ranking">Ranking</option>
              <option value="percent">Percent</option>
              <option value="attemptResult">Result</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label
            htmlFor="advacement-condition-value"
            className="col-sm-3 control-label"
          >
            {valueLabel}
          </label>
          <div className="col-sm-9">{advancementInput}</div>
        </div>

        {helpBlock}
      </div>
    );
  },
};
