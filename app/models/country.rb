# frozen_string_literal: true

class Country < ApplicationRecord
  include Cachable
  include StaticData

  self.table_name = "Countries"

  has_one :wfc_dues_redirect, as: :redirect_source

  SUPPORTED_TIMEZONES = ActiveSupport::TimeZone::MAPPING.values.uniq.freeze

  FICTIVE_COUNTRY_DATA_PATH = StaticData::DATA_FOLDER.join("#{self.data_file_handle}.fictive.json")
  MULTIPLE_COUNTRIES = self.parse_json_file(FICTIVE_COUNTRY_DATA_PATH).freeze

  FICTIVE_IDS = MULTIPLE_COUNTRIES.pluck(:id).freeze
  NAME_LOOKUP_ATTRIBUTE = :iso2

  include LocalizedSortable

  REAL_COUNTRY_DATA_PATH = StaticData::DATA_FOLDER.join("#{self.data_file_handle}.real.json")
  WCA_STATES_JSON = self.parse_json_file(REAL_COUNTRY_DATA_PATH, symbolize_names: false).freeze

  WCA_COUNTRIES = WCA_STATES_JSON["states_lists"].flat_map do |list|
    list["states"].map do |state|
      state_id = state["id"] || I18n.transliterate(state["name"]).tr("'", "_")
      { id: state_id, continentId: state["continent_id"],
        iso2: state["iso2"], name: state["name"] }
    end
  end.freeze

  WCA_COUNTRY_ISO_CODES = WCA_COUNTRIES.pluck(:iso2).freeze
  WCA_COUNTRY_IDS = WCA_COUNTRIES.pluck(:id).freeze

  ALL_STATES_RAW = [
    WCA_COUNTRIES,
    MULTIPLE_COUNTRIES,
  ].flatten.freeze

  ALL_COUNTRY_IDS = ALL_STATES_RAW.pluck(:id).freeze

  def self.all_raw
    ALL_STATES_RAW
  end

  # As of writing this comment, the actual `Countries` data is controlled by WRC
  # and we only have control over the 'fictive' values. We parse the WRC file above and override
  # the `all_raw` getter to include the real countries, but they're not part of our static dataset in the stricter sense

  def self.dump_static
    MULTIPLE_COUNTRIES
  end

  def self.data_file_handle
    "#{self.name.pluralize.underscore}.fictive"
  end

  belongs_to :continent, foreign_key: :continentId
  alias_attribute :continent_id, :continentId
  has_many :competitions, foreign_key: :countryId
  has_one :band, foreign_key: :iso2, primary_key: :iso2, class_name: "CountryBand"

  def continent
    Continent.c_find(self.continentId)
  end

  def self.find_by_iso2(iso2)
    c_values.select { |c| c.iso2 == iso2 }.first
  end

  def multiple_countries?
    MULTIPLE_COUNTRIES.any? { |c| c[:id] == self.id }
  end
end
