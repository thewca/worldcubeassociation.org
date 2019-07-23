# frozen_string_literal: true

module ResultsValidators
  class PositionsValidator < GenericValidator
    WRONG_POSITION_IN_RESULTS_ERROR = "[%{round_id}] Result for %{person_name} has a wrong position: expected %{expected_pos} and got %{pos}."

    @@desc = "This validator checks that positions stored in results are correct with regard to the actual results."

    def validate(competition_ids: [], model: Result, results: nil)
      reset_state
      # Get all results if not provided
      results ||= model.sorted_for_competitions(competition_ids)
      results.group_by(&:competitionId).each do |competition_id, results_for_comp|
        results_for_comp.group_by { |r| "#{r.eventId}-#{r.roundTypeId}" }.each do |round_id, results_for_round|
          expected_pos = 0
          last_result = nil
          # Number of tied competitors, *without* counting the first one
          number_of_tied = 0
          results_for_round.each_with_index do |result, index|
            # Check for position in round
            # The scope "InboxResult.sorted_for_competitions" already sorts by average then best,
            # so we simply need to check that the position stored matched the expected one

            # Unless we find two exact same results, we increase the expected position
            tied = false
            if last_result
              if ["a", "m"].include?(result.formatId)
                # If the ranking is based on average, look at both average and best.
                tied = result.average == last_result.average && result.best == last_result.best
              else
                # else we just compare the bests
                tied = result.best == last_result.best
              end
            end
            if tied
              number_of_tied += 1
            else
              expected_pos += 1
              expected_pos += number_of_tied
              number_of_tied = 0
            end
            last_result = result

            if expected_pos != result.pos
              @errors << ValidationError.new(:results, competition_id,
                                             WRONG_POSITION_IN_RESULTS_ERROR,
                                             round_id: round_id,
                                             person_name: self.name_from_result(result),
                                             expected_pos: expected_pos,
                                             pos: result.pos)
            end
          end
        end
      end
      self
    end
  end
end
