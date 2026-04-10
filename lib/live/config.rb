# frozen_string_literal: true

module Live
  module Config
    def self.enabled?
      true
    end

    def self.sqs_queued?
      Rails.env.production?
    end

    def self.broadcast_key(competition_id, round_id)
      "results_#{competition_id}_#{round_id}"
    end
  end
end
