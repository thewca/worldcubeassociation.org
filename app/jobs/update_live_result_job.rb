# frozen_string_literal: true

class UpdateLiveResultJob < ApplicationJob
  self.queue_adapter = :shoryuken if Live::Config.sqs_queued?
  queue_as EnvConfig.LIVE_QUEUE if Live::Config.sqs_queued?

  def perform(live_result, results, entered_by_id)
    round = live_result.round

    Live::DiffHelper.broadcast_changes(round) do
      Live::ResultUpdater.apply_result(live_result, results, entered_by_id)
    end
  end
end
