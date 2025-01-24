# frozen_string_literal: true

class AddLiveResultJob < ApplicationJob
  self.queue_adapter = :shoryuken if Rails.env.production? && !EnvConfig.LIVE_SITE?
  queue_as EnvConfig.LIVE_QUEUE if Rails.env.production? && !EnvConfig.LIVE_SITE?

  def perform(params)
    LiveResult.create(params)
  end
end
