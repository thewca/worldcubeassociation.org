# frozen_string_literal: true

class AddLiveResultJob < ApplicationJob
  self.queue_adapter = :shoryuken if WcaLive.sqs_queued?
  queue_as EnvConfig.LIVE_QUEUE if WcaLive.sqs_queued?

  def perform(results, round_id, registration_id, entered_by)
    attempts = results.map.with_index(1) do |r, i|
      LiveAttempt.build_with_history_entry(r, i, entered_by)
    end
    round = Round.find(round_id)
    event = round.event
    format = round.format

    r = Result.new(
      event_id: event.id,
      round_type_id: round.round_type_id,
      round_id: round.id,
      format_id: format.id,
      result_attempts: results.map.with_index(1) { |r, index| ResultAttempt.new(attempt_number: index, value: r) },
    )

    LiveResult.create!(registration_id: registration_id,
                       round: round,
                       live_attempts: attempts,
                       last_attempt_entered_at: Time.now.utc,
                       best: r.compute_correct_best,
                       average: r.compute_correct_average)
  end
end
