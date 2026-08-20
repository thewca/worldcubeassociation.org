# frozen_string_literal: true

module Live
  # Applies one competitor's attempts to their LiveResult. Does NOT broadcast —
  # callers must wrap invocations in Live::DiffHelper.broadcast_changes(round) so
  # a single result (UpdateLiveResultJob) or a whole batch (BatchUpdateLiveResultJob)
  # produces exactly one broadcast.
  module ResultUpdater
    VALUE_COLUMN = {
      single: :best,
      average: :average,
    }.freeze

    module_function

    def apply_result(live_result, results, entered_by_id)
      round = live_result.round
      result_upserts = results.map { it.merge(live_result_id: live_result.id) }

      LiveAttempt.upsert_all(result_upserts)

      attempt_numbers = results.pluck(:attempt_number)
      live_result.live_attempts.where.not(attempt_number: attempt_numbers).delete_all

      new_attempts = live_result.live_attempts.reload # We did some `upsert_all` and `delete_all` shenanigans above, which bypass Rails memory. Hence reloading...
      average, best = LiveResult.compute_average_and_best(new_attempts, round)

      # `upsert_all` above bypasses Rails callbacks so the counter cache isn't updated automatically.
      # `live_attempts_count` is attr_readonly on LiveResult (Rails protects counter cache columns),
      # so we can't set it directly in update!.
      LiveResult.reset_counters(live_result.id, :live_attempts)

      person = live_result.registration.person
      previous_round_ids = round.competition_event.rounds.where(number: ...round.number).ids

      live_result.update!(
        best: best,
        average: average,
        last_attempt_entered_at: Time.now.utc,
        single_record_tag: compute_pr(live_result, best, person, :single, previous_round_ids),
        average_record_tag: compute_pr(live_result, average, person, :average, previous_round_ids),
      )

      history_ordered_results = new_attempts.order(:attempt_number).pluck(:value)
      live_result.live_result_history_entries.create!(entered_by_id: entered_by_id, action_type: :scoretaking, attempt_details: history_ordered_results)
    end

    def compute_pr(live_result, value, person, type, previous_round_ids)
      col = VALUE_COLUMN[type]

      if value <= 0 || better_pr_in_previous_round?(live_result, "#{type}_record_tag", col, value, previous_round_ids)
        nil
      elsif person.nil?
        "PR"
      else
        pr = person.public_send(:"ranks_#{type}").find { |r| r.event_id == live_result.event_id }
        "PR" if pr.nil? || value < pr.best
      end
    end

    def better_pr_in_previous_round?(live_result, tag_column, value_column, current_value, previous_ids)
      return false if previous_ids.empty?

      best_previous_pr = LiveResult.where(registration_id: live_result.registration_id, round_id: previous_ids)
                                   .where(tag_column => "PR")
                                   .minimum(value_column)

      best_previous_pr.present? && best_previous_pr <= current_value
    end
  end
end
