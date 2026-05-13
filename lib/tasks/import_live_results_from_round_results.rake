# frozen_string_literal: true

namespace :live_results do
  desc "Moves RoundResults to Live Results"
  task :migrate_competition_round_results, [:competition_id] => [:environment] do |_, args|
    competition_id = args[:competition_id]

    abort "Competition id is required" if competition_id.blank?

    competition = Competition.find(competition_id)
    registrations_by_wcif_id = competition.registrations.index_by(&:registrant_id)

    abort "Competition #{competition_id} not found" if competition.nil?

    # Sort rounds first so advancing can be correctly calculated
    sorted_rounds = competition.rounds.sort_by { |round| round.round_type.rank }

    live_results = sorted_rounds.flat_map do |round|
      round.round_results.map do |round_result|
        results = round_result.attempts

        attempts = results.map.with_index(1) do |rr, i|
          LiveAttempt.build(value: rr.result, attempt_number: i)
        end

        history_entry = LiveResultHistoryEntry.build(
          action_source: :backfilling,
          attempt_details: attempts.pluck(:value),
        )

        correct_average, correct_best = LiveResult.compute_average_and_best(attempts, round)

        {
          registration_id: registrations_by_wcif_id[round_result.person_id].id,
          round: round,
          live_attempts: attempts,
          live_result_history_entries: [history_entry],
          last_attempt_entered_at: Time.now.utc,
          best: correct_best,
          average: correct_average,
        }
      end
    end

    LiveResult.create(live_results)
  end
end
