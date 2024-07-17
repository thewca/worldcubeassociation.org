# frozen_string_literal: true

class EligibleCountryIso2ForChampionship < ApplicationRecord
  include StaticData

  self.table_name = "eligible_country_iso2s_for_championship"

  belongs_to :championship, foreign_key: :championship_type, primary_key: :championship_type, optional: true

  validates :eligible_country_iso2, uniqueness: { scope: :championship_type, case_sensitive: false },
                                    inclusion: { in: Country::ALL_STATES_RAW.pluck(:iso2) }

  def self.data_file_handle
    "championship_eligible_iso2"
  end

  def self.all_raw
    self.static_json_data.flat_map do |type, iso2_list|
      iso2_list.map do |iso2|
        { championship_type: type, eligible_country_iso2: iso2 }
      end
    end
  end

  def self.dump_static
    self.all
        .group_by(&:championship_type)
        .transform_values { |el| el.pluck(:eligible_country_iso2) }
        .as_json
  end

  def self.championship_types
    all_raw.pluck(:championship_type).uniq
  end
end
