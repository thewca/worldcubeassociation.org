# frozen_string_literal: true

class AddLiveResultJob < ApplicationJob
  self.queue_adapter = :shoryuken if WcaLive.sqs_queued?
  queue_as EnvConfig.LIVE_QUEUE if WcaLive.sqs_queued?

  def perform(params)
    ActionCable.server.broadcast(WcaLive.broadcast_key(params[:round_id]),
                                 { attempts: params[:results], user_id: params[:user_id] })
  end
end
