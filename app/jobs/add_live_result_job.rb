# frozen_string_literal: true

class AddLiveResultJob < ApplicationJob
  self.queue_adapter = :shoryuken if WcaLive.sqs_queued?
  queue_as EnvConfig.LIVE_QUEUE if WcaLive.sqs_queued?

  def perform(results, round_id, registration_id, entered_by)
    attempts = results.map.with_index(1) do |r, i|
      LiveAttempt.build_with_history_entry(r, i, entered_by)
    end
    round = Round.find(round_id)

    average, best = LiveResult.compute_average_and_best(attempts, round)

    LiveResult.create!(registration_id: registration_id,
                       round: round,
                       live_attempts: attempts,
                       last_attempt_entered_at: Time.now.utc,
                       best: best,
                       average: average)
  end
end
