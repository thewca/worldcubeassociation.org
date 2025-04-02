# frozen_string_literal: true

require 'active_support/concern'

module PersonalBest
  extend ActiveSupport::Concern

  def rank_to_wcif(type)
    {
      eventId: event_id,
      best: best,
      worldRanking: world_rank,
      continentalRanking: continent_rank,
      nationalRanking: country_rank,
      type: type,
    }
  end

  def self.wcif_json_schema
    {
      "type" => "object",
      "properties" => {
        "eventId" => { "type" => "string", "enum" => Event.pluck(:id) },
        "best" => { "type" => "integer" },
        "worldRanking" => { "type" => "integer" },
        "continentalRanking" => { "type" => "integer" },
        "nationalRanking" => { "type" => "integer" },
        "type" => { "type" => "string", "enum" => %w(single average) },
      },
    }
  end
end
