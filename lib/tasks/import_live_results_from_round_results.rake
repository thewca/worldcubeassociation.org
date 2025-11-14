# frozen_string_literal: true

namespace :live_results do
  desc "Moves RoundResults to Live Results"
  task :migrate_competition_round_results, [:competition_id] => [:environment] do |_, args|
    competition_id = args[:competition_id]

    abort "Competition id is required" if competition_id.blank?

    competition = Competition.find(competition_id)
    registrations_by_wcif_id = competition.registrations.index_by(&:registrant_id)

    abort "Competition #{competition_id} not found" if competition.nil?

    live_results = []

    # Sort rounds first so advancing can be correctly calculated
    sorted_rounds = competition.rounds.sort_by { |round| round.round_type.rank }

    sorted_rounds.each do |round|
      round.round_results.each do |round_result|
        event = round.event
        format = round.format
        results = round_result.attempts

        attempts = results.map.with_index(1) do |r, i|
          LiveAttempt.build_with_history_entry(r.result, i, 1)
        end

        r = Result.new(
          value1: results[0]&.result,
          value2: results[1]&.result || 0,
          value3: results[2]&.result || 0,
          value4: results[3]&.result || 0,
          value5: results[4]&.result || 0,
          event_id: event.id,
          round_type_id: round.round_type_id,
          round_id: round.id,
          format_id: format.id,
        )

        live_results << {
          registration_id: registrations_by_wcif_id[round_result.person_id].id,
          round: round,
          live_attempts: attempts,
          last_attempt_entered_at: Time.now.utc,
          best: r.compute_correct_best,
          average: r.compute_correct_average,
        }
      end
    end
    LiveResult.create(live_results)
  end
end
