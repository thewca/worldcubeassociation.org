# frozen_string_literal: true

class AddLiveResultJob < ApplicationJob
  self.queue_adapter = :shoryuken if WcaLive.sqs_queued?
  queue_as EnvConfig.LIVE_QUEUE if WcaLive.sqs_queued?

  # params: { results, round_id, user_id, entered_by }
  def perform(params)
    results = params[:results]
    attempts = results.map.with_index(1) { |r, i| LiveAttempt.build(result: r, attempt_number: i) }
    round = Round.find(params[:round_id])
    event = round.event
    format = round.format

    r = Result.build({ value1: results[0], value2: results[1] || 0, value3: results[2] || 0, value4: results[3] || 0, value5: results[4] || 0, event_id: event.id, round_type_id: round.round_type_id, format_id: format.id })

    LiveResult.create!(registration_id: params[:registration_id],
                       round: round,
                       live_attempts: attempts,
                       entered_by: params[:entered_by],
                       entered_at: Time.now.utc,
                       best: r.compute_correct_best,
                       average: r.compute_correct_average)
  end
end
