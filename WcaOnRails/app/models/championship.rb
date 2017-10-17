# frozen_string_literal: true

class Championship < ApplicationRecord
  belongs_to :competition
  has_many :eligible_country_iso2s_for_championship, class_name: "EligibleCountryIso2ForChampionship", foreign_key: :championship_type, primary_key: :championship_type
  validates_presence_of :competition
  validates :championship_type, uniqueness: { scope: :competition_id },
                                inclusion: { in: ["world", *Continent.all.map(&:id), *Country.all.map(&:iso2), *EligibleCountryIso2ForChampionship.championship_types] }
  def name
    return "World Championship" if championship_type == "world"

    return "Greater China Championship" if championship_type == "greater_china"

    continent = Continent.c_find(championship_type)
    return "Continental Championship for #{continent.name}" if continent

    country = Country.find_by_iso2(championship_type)
    return "National Championship for #{country.name}" if country
  end
end
