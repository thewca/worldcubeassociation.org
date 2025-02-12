# frozen_string_literal: true

class AddLiveResultJob < ApplicationJob
  self.queue_adapter = :shoryuken if WcaLive.sqs_queued?
  queue_as EnvConfig.LIVE_QUEUE if WcaLive.sqs_queued?

  def perform(results, round_id, registration_id, entered_by)
    attempts = results.map.with_index(1) { |r, i| LiveAttempt.build(result: r, attempt_number: i, entered_by: entered_by, entered_at: Time.now.utc) }
    round = Round.find(round_id)
    event = round.event
    format = round.format

    r = Result.new(value1: results[0], value2: results[1] || 0, value3: results[2] || 0, value4: results[3] || 0, value5: results[4] || 0, event_id: event.id, round_type_id: round.round_type_id, format_id: format.id)

    LiveResult.create!(registration_id: registration_id,
                       round: round,
                       live_attempts: attempts,
                       last_attempt_entered_at: Time.now.utc,
                       best: r.compute_correct_best,
                       average: r.compute_correct_average,
                       live_attempt_history_entries: [LiveAttemptHistoryEntry.build(
                         result: r,
                         entered_at: Time.now.utc,
                         entered_by: current_user
                       )])
  end
end
