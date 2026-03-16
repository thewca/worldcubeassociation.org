# frozen_string_literal: true

class UpdateLiveResultJob < ApplicationJob
  self.queue_adapter = :shoryuken if Live::Config.sqs_queued?
  queue_as EnvConfig.LIVE_QUEUE if Live::Config.sqs_queued?

  def perform(live_result, results, entered_by_id)
    result_upserts = results.map { it.merge(live_result_id: live_result.id) }
    LiveAttempt.upsert_all(result_upserts)

    attempt_numbers = results.pluck(:attempt_number)
    live_result.live_attempts.where.not(attempt_number: attempt_numbers).delete_all

    round = live_result.round

    Live::DiffHelper.broadcast_changes(round) do
      new_attempts = live_result.live_attempts.reload # We did some `upsert_all` and `delete_all` shenanigans above, which bypass Rails memory. Hence reloading...
      average, best = LiveResult.compute_average_and_best(new_attempts, round)
      history_ordered_results = new_attempts.order(:attempt_number).pluck(:value)
      live_result.live_result_history_entries.create!(entered_by_id: entered_by_id, action_type: :scoretaking, attempt_details: history_ordered_results)

      live_result.update!(best: best, average: average, last_attempt_entered_at: Time.now.utc)
    end
  end
end
