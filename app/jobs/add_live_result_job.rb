# frozen_string_literal: true

class AddLiveResultJob < ApplicationJob
  self.queue_adapter = :shoryuken if WcaLive.sqs_queued?
  queue_as EnvConfig.LIVE_QUEUE if WcaLive.sqs_queued?

  def perform(results, round_id, registration_id, entered_by)
    attempts = results.map do |r|
      LiveAttempt.build_with_history_entry(r["result"], r["attempt_number"], entered_by)
    end

    round = Round.find(round_id)
    event = round.event
    format = round.format

    r = Result.new(
      value1: attempts[0].result,
      value2: attempts[1]&.result || 0,
      value3: attempts[2]&.result || 0,
      value4: attempts[3]&.result || 0,
      value5: attempts[4]&.result || 0,
      event_id: event.id,
      round_type_id: round.round_type_id,
      round_id: round.id,
      format_id: format.id,
    )

    LiveResult.create!(registration_id: registration_id,
                       round: round,
                       live_attempts: attempts,
                       last_attempt_entered_at: Time.now.utc,
                       best: r.compute_correct_best,
                       average: r.compute_correct_average)
  end
end
