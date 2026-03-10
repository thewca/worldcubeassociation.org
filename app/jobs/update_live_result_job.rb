# frozen_string_literal: true

class UpdateLiveResultJob < ApplicationJob
  self.queue_adapter = :shoryuken if Live::Config.sqs_queued?
  queue_as EnvConfig.LIVE_QUEUE if Live::Config.sqs_queued?

  def perform(live_result, results, entered_by_id)
    LiveAttempt.upsert_all(results)

    attempt_numbers = results.pluck(:attempt_number)
    live_result.result_attempts.where.not(attempt_number: attempt_numbers).delete_all

    round = live_result.round

    # We need the state before the result is updated
    before_state = round.to_live_state

    new_attempts = live_result.result_attempts.reload # We did some `upsert_all` and `delete_all` shenanigans above, which bypass Rails memory. Hence reloading...
    average, best = LiveResult.compute_average_and_best(new_attempts, round)

    live_result.update!(best: best, average: average, last_attempt_entered_at: live_result.current_time_from_proper_timezone)

    history_ordered_results = results.sort_by { it[:attempt_number] }.pluck(:value)
    live_result.live_result_history_entries.create!(entered_by_id: entered_by_id, action_type: :scoretaking, attempt_details: history_ordered_results)

    after_state = round.to_live_state
    diff = Live::DiffHelper.round_state_diff(before_state, after_state)

    diff = Live::DiffHelper.add_forecast_stats(diff, round)

    ActionCable.server.broadcast(Live::Config.broadcast_key(round.wcif_id), diff)
  end
end
