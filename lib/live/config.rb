# frozen_string_literal: true

module Live
  module Config
    def self.enabled?
      # We have to return `true` during assets compilation so that all routes
      #   are defined and can be exported to the JS routes ERB template.
      !EnvConfig.WCA_LIVE_SITE? || EnvConfig.ASSETS_COMPILATION?
    end

    def self.sqs_queued?
      Rails.env.production? && self.enabled?
    end

    def self.broadcast_key(round_id)
      "results_#{round_id}"
    end
  end
end
