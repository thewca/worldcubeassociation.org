# frozen_string_literal: true

class UpdateLiveResultJob < ApplicationJob
  self.queue_adapter = :shoryuken if Live::Config.sqs_queued?
  queue_as EnvConfig.LIVE_QUEUE if Live::Config.sqs_queued?

  def perform(live_result, results, entered_by_id)
    previous_attempts = live_result.live_attempts.index_by(&:attempt_number)

    new_attempts = results.map do |r|
      previous_attempt = previous_attempts[r[:attempt_number]]

      if previous_attempt.present?
        if previous_attempt.result == r[:value]
          previous_attempt
        else
          previous_attempt.update_with_history_entry(r[:value], entered_by_id)
        end
      else
        LiveAttempt.build_with_history_entry(r[:value], r[:attempt_number], entered_by_id)
      end
    end

    round = live_result.round

    # We need the state before the result is updated
    before_state = round.to_live_state

    average, best = LiveResult.compute_average_and_best(new_attempts, round)

    live_result.update!(live_attempts: new_attempts, best: best, average: average, last_attempt_entered_at: Time.now.utc)

    after_state = round.to_live_state
    diff = Live::DiffHelper.round_state_diff(before_state, after_state)
    ActionCable.server.broadcast(Live::Config.broadcast_key(round.wcif_id), diff)
  end
end
