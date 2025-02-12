# frozen_string_literal: true

module WcaLive
  def self.enabled?
    !EnvConfig.WCA_LIVE_SITE?
  end

  def self.sqs_queued?
    Rails.env.production? && self.enabled?
  end

  def self.broadcast_key(round_id)
    "results_#{round_id}"
  end
end
