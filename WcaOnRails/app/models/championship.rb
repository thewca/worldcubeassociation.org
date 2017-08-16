# frozen_string_literal: true

class Championship < ApplicationRecord
  belongs_to :competition
  validates_presence_of :competition
  validates :championship_type, uniqueness: { scope: :competition_id },
                                inclusion: { in: ["world", *Continent.all.map(&:id), *Country.all.map(&:iso2), *EligibleCountryIso2ForChampionship.championship_types] }
end
