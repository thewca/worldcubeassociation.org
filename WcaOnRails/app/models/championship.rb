# frozen_string_literal: true

class Championship < ApplicationRecord
  include Comparable
  MAJOR_CHAMPIONSHIP_TYPES = [
    "world",
    *Continent.real.map(&:id),
  ].freeze
  CHAMPIONSHIP_TYPES = [
    *MAJOR_CHAMPIONSHIP_TYPES,
    *Country.real.map(&:iso2),
    *EligibleCountryIso2ForChampionship.championship_types,
  ].freeze

  belongs_to :competition
  has_many :eligible_country_iso2s_for_championship, class_name: "EligibleCountryIso2ForChampionship", foreign_key: :championship_type, primary_key: :championship_type
  validates_presence_of :competition
  validates :championship_type, uniqueness: { scope: :competition_id, case_sensitive: false },
                                inclusion: { in: CHAMPIONSHIP_TYPES }

  def name
    return I18n.t('competitions.competition_form.championship_types.world') if world?

    return I18n.t('competitions.competition_form.championship_types.greater_china') if greater_china?

    return I18n.t('competitions.competition_form.championship_types.continental', continent: continent.name) if continent

    return I18n.t('competitions.competition_form.championship_types.national', country: country.name) if country

    I18n.t('competitions.competition_form.championship_types.generic', type: championship_type)
  end

  def country
    Country.find_by_iso2(championship_type)
  end

  def greater_china?
    championship_type == "greater_china"
  end

  def continent
    Continent.c_find(championship_type)
  end

  def world?
    championship_type == "world"
  end

  def to_a
    [
      world? ? 0 : 1,
      continent ? 0 : 1,
      greater_china? ? 0 : 1,
      country ? 0 : 1,
    ]
  end

  def <=>(other)
    self.to_a <=> other.to_a
  end
end
