# frozen_string_literal: true

class EligibleCountryIso2ForChampionship < ApplicationRecord
  self.table_name = "eligible_country_iso2s_for_championship"

  validates :eligible_country_iso2, uniqueness: { scope: :championship_type },
                                    inclusion: { in: Country.all.map(&:iso2) }

  def self.championship_types
    pluck(:championship_type).uniq
  end
end
