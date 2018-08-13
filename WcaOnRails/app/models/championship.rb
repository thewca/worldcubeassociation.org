# frozen_string_literal: true

class Championship < ApplicationRecord
  CHAMPIONSHIP_TYPES = [
    "world",
    *Continent.real.map(&:id),
    *Country.real.map(&:iso2),
    *EligibleCountryIso2ForChampionship.championship_types,
  ].freeze

  belongs_to :competition
  has_many :eligible_country_iso2s_for_championship, class_name: "EligibleCountryIso2ForChampionship", foreign_key: :championship_type, primary_key: :championship_type
  validates_presence_of :competition
  validates :championship_type, uniqueness: { scope: :competition_id },
                                inclusion: { in: CHAMPIONSHIP_TYPES }

  def name
    return "World Championship" if championship_type == "world"

    return "Greater China Championship" if championship_type == "greater_china"

    continent = Continent.c_find(championship_type)
    return "Continental Championship for #{continent.name}" if continent

    country = Country.find_by_iso2(championship_type)
    return "National Championship for #{country.name}" if country

    "Championship for #{championship_type}"
  end
end
