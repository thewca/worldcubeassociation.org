# frozen_string_literal: true

class AddLiveResultJob < ApplicationJob
  self.queue_adapter = :shoryuken if Rails.env.production? && !EnvConfig.WCA_LIVE_SITE?
  queue_as EnvConfig.LIVE_QUEUE if Rails.env.production? && !EnvConfig.WCA_LIVE_SITE?

  def perform(params)
    ActionCable.server.broadcast("results_#{params[:round_id]}",
                                 { attempts: params[:results], user_id: params[:user_id] })
  end
end
