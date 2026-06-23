# frozen_string_literal: true

class BatchUpdateLiveResultJob < ApplicationJob
  self.queue_adapter = :shoryuken if Live::Config.sqs_queued?
  queue_as EnvConfig.LIVE_QUEUE if Live::Config.sqs_queued?

  # entries: [{ live_result:, results: }, ...], all belonging to `round`.
  # One broadcast for the whole batch instead of one per result.
  def perform(round, entries, entered_by_id)
    Live::DiffHelper.broadcast_changes(round) do
      entries.each do |entry|
        Live::ResultUpdater.apply_result(entry[:live_result], entry[:results], entered_by_id)
      end
    end
  end
end
