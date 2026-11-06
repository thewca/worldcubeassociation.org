# frozen_string_literal: true

class BatchUpdateLiveResultJob < ApplicationJob
  self.queue_adapter = :shoryuken if Live::Config.sqs_queued?
  queue_as EnvConfig.LIVE_QUEUE if Live::Config.sqs_queued?

  # entries: [{ live_result_id:, results: }, ...], all belonging to `round`.
  # Ids instead of records so a row deleted between enqueue and dequeue skips
  # that entry instead of failing deserialization for the whole batch.
  # One broadcast for the whole batch instead of one per result.
  def perform(round_id, entries, entered_by_id)
    round = Round.find_by(id: round_id)
    return if round.nil?

    Live::DiffHelper.broadcast_changes(round) do
      entries.each do |entry|
        live_result = round.live_results.find_by(id: entry[:live_result_id])
        next if live_result.nil? # competitor was quit between enqueue and dequeue

        Live::ResultUpdater.apply_result(live_result, entry[:results], entered_by_id)
      end
    end
  end
end
