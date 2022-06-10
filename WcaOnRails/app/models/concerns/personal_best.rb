# frozen_string_literal: true

require 'active_support/concern'

module PersonalBest
  extend ActiveSupport::Concern

  def rank_to_wcif(type)
    {
      eventId: eventId,
      best: best,
      worldRanking: worldRank,
      continentalRanking: continentRank,
      nationalRanking: countryRank,
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
