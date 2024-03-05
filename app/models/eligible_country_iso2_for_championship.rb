# frozen_string_literal: true

class EligibleCountryIso2ForChampionship < ApplicationRecord
  self.table_name = "eligible_country_iso2s_for_championship"

  belongs_to :championship, foreign_key: :championship_type, primary_key: :championship_type, optional: true

  validates :eligible_country_iso2, uniqueness: { scope: :championship_type, case_sensitive: false },
                                    inclusion: { in: Country.all.map(&:iso2) }

  def self.championship_types
    pluck(:championship_type).uniq
  end
end
