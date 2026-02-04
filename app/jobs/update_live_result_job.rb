# frozen_string_literal: true

class UpdateLiveResultJob < ApplicationJob
  self.queue_adapter = :shoryuken if Live::Config.sqs_queued?
  queue_as EnvConfig.LIVE_QUEUE if Live::Config.sqs_queued?

  def perform(results, live_result_id, entered_by)
    live_result = LiveResult.find(live_result_id)

    previous_attempts = result.live_attempts.index_by(&:attempt_number)

    new_attempts = attempts.map do |r|
      previous_attempt = previous_attempts[r[:attempt_number]]

      if previous_attempt.present?
        if previous_attempt.result == r[:value]
          previous_attempt
        else
          previous_attempt.update_with_history_entry(r[:value], user)
        end
      else
        LiveAttempt.build_with_history_entry(r[:value], r[:attempt_number], user)
      end
    end

    round = Round.find(live_result.round_id)

    average, best = LiveResult.compute_average_and_best(attempts, round)

    live_result.update!(live_attempts: new_attempts, best: best, average: average, last_attempt_entered_at: Time.now.utc)
  end
end
