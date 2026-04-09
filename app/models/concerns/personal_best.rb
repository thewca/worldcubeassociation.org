# frozen_string_literal: true

require 'active_support/concern'

module PersonalBest
  extend ActiveSupport::Concern

  def self.rank_value_key(version: Competition::WCIF_STABLE_VERSION)
    if Gem::Version.new(version) >= Gem::Version.new("2.0.0")
      "value"
    else
      "best"
    end
  end

  def rank_to_wcif(type, version: Competition::WCIF_STABLE_VERSION)
    {
      "eventId" => event_id,
      PersonalBest.rank_value_key(version: version) => best,
      "worldRanking" => world_rank,
      "continentalRanking" => continent_rank,
      "nationalRanking" => country_rank,
      "type" => type,
    }
  end

  def self.wcif_json_schema(version: Competition::WCIF_STABLE_VERSION)
    {
      "type" => "object",
      "properties" => {
        "eventId" => { "type" => "string", "enum" => Event.pluck(:id) },
        PersonalBest.rank_value_key(version: version) => { "type" => "integer" },
        "worldRanking" => { "type" => "integer" },
        "continentalRanking" => { "type" => "integer" },
        "nationalRanking" => { "type" => "integer" },
        "type" => { "type" => "string", "enum" => %w[single average] },
      },
    }
  end
end
