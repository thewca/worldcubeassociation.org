import React from 'react'

import AttemptResultInput from './AttemptResultInput'
import { attemptResultToString, roundIdToString, matchResult } from './utils'

export default {
  Title({ wcifRound }) {
    return <span>Requirement to advance past {roundIdToString(wcifRound.id)}</span>;
  },
  Show({ value: advancementCondition, wcifEvent }) {
    function advanceReqToStr(advancementCondition) {
      if(!advancementCondition) {
        return "-";
      }

      switch(advancementCondition.type) {
        case "ranking":
          return `Top ${advancementCondition.level}`;
          break;
        case "percent":
          return `Top ${advancementCondition.level}%`;
          break;
        case "attemptResult":
          return matchResult(advancementCondition.level, wcifEvent.id, { short: true });
          break;
        default:
          throw new Error(`Unrecognized advancementCondition type: ${advancementCondition.type}`);
          break;
      }
    }
    let str = advanceReqToStr(advancementCondition);
    return <span>{str}</span>;
  },
  Input({ value: advancementCondition, onChange, autoFocus, roundNumber, wcifEvent }) {
    let typeInput, rankingInput, percentInput, attemptResultInput;
    let onChangeAggregator = () => {
      let type = typeInput.value;
      let newAdvancementCondition;
      switch(typeInput.value) {
        case "ranking":
          newAdvancementCondition = {
            type: "ranking",
            level: rankingInput ? parseInt(rankingInput.value): 0,
          };
          break;
        case "percent":
          newAdvancementCondition = {
            type: "percent",
            level: percentInput ? parseInt(percentInput.value) : 0,
          };
          break;
        case "attemptResult":
          newAdvancementCondition = {
            type: "attemptResult",
            level: attemptResultInput ? parseInt(attemptResultInput.value) : 0,
          };
          break;
        default:
          newAdvancementCondition = null;
          break;
      }
      onChange(newAdvancementCondition);
    };

    let advancementInput = null;
    let helpBlock = null;
    let advancementType = advancementCondition ? advancementCondition.type : "";
    switch(advancementType) {
      case "ranking":
        advancementInput = <input type="number" name="ranking" className="form-control" value={advancementCondition.level} onChange={onChangeAggregator} ref={c => rankingInput = c} />;
        helpBlock = `The top ${advancementCondition.level} competitors from round ${roundNumber} will advance to round ${roundNumber + 1}.`;
        break;
      case "percent":
        advancementInput = <input type="number" name="percent" className="form-control" value={advancementCondition.level} onChange={onChangeAggregator} ref={c => percentInput = c} />;
        helpBlock = `The top ${advancementCondition.level}% of competitors from round ${roundNumber} will advance to round ${roundNumber + 1}.`;
        break;
      case "attemptResult":
        advancementInput = <AttemptResultInput eventId={wcifEvent.id} value={advancementCondition.level} onChange={onChangeAggregator} ref={c => attemptResultInput = c} />;
        helpBlock = `Everyone in round ${roundNumber} with a result ${matchResult(advancementCondition.level, wcifEvent.id)} will advance to round ${roundNumber + 1}.`;
        break;
      default:
        advancementInput = null;
        break;
    }

    return (
      <div>
        <div className="form-group">
          <div className="col-sm-12">
            <div className="input-group advancement-condition">
              <select value={advancementCondition ? advancementCondition.type : ""}
                      name="type"
                      autoFocus={autoFocus}
                      onChange={onChangeAggregator}
                      className="form-control"
                      ref={c => typeInput = c}
              >
                <option value="">To be announced</option>
                <option disabled="disabled">────────</option>
                <option value="ranking">Ranking</option>
                <option value="percent">Percent</option>
                <option value="attemptResult">Result</option>
              </select>

              {advancementInput}
            </div>
          </div>
        </div>
        {helpBlock}
      </div>
    );
  },
};
