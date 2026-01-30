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

    # There always exist empty results
    live_result = round.live_results.find_by!(registration_id: registration_id)

    live_result.update!(live_attempts: attempts, best: best, average: average, last_attempt_entered_at: Time.now.utc)
  end
end
