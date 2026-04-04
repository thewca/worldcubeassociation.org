# frozen_string_literal: true

require 'active_support/concern'

module PersonalBest
  extend ActiveSupport::Concern

  def rank_to_wcif(type, version: Competition::WCIF_STABLE_VERSION)
    base_wcif = {
      "eventId" => event_id,
      "worldRanking" => world_rank,
      "continentalRanking" => continent_rank,
      "nationalRanking" => country_rank,
      "type" => type,
    }

    if Gem::Version.new(version) >= Gem::Version.new("2.0.0")
      base_wcif.merge("value" => best)
    else
      base_wcif.merge("best" => best)
    end
  end

  def self.wcif_json_schema(version: Competition::WCIF_STABLE_VERSION)
    if Gem::Version.new(version) >= Gem::Version.new("2.0.0")
      {
        "type" => "object",
        "properties" => {
          "eventId" => { "type" => "string", "enum" => Event.pluck(:id) },
          "value" => { "type" => "integer" },
          "worldRanking" => { "type" => "integer" },
          "continentalRanking" => { "type" => "integer" },
          "nationalRanking" => { "type" => "integer" },
          "type" => { "type" => "string", "enum" => %w[single average] },
        },
      }
    else
      {
        "type" => "object",
        "properties" => {
          "eventId" => { "type" => "string", "enum" => Event.pluck(:id) },
          "best" => { "type" => "integer" },
          "worldRanking" => { "type" => "integer" },
          "continentalRanking" => { "type" => "integer" },
          "nationalRanking" => { "type" => "integer" },
          "type" => { "type" => "string", "enum" => %w[single average] },
        },
      }
    end
  end
end
