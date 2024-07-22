# frozen_string_literal: true

class Country < ApplicationRecord
  include Cachable
  include StaticData

  self.table_name = "Countries"

  has_one :wfc_dues_redirect, as: :redirect_source

  ALL_TIMEZONES_MAPPING = begin
    all_tz = ActiveSupport::TimeZone::MAPPING
    grouped_tz = all_tz.group_by { |k, v| v }
    duplicates = grouped_tz.select { |k, v| v.size > 1 }
    duplicates.each do |tz_id, tz_entries|
      selected_name = tz_id
      # Try to be smarter here, and find the closest matching name
      # rubocop:disable Style/HashEachMethods
      tz_entries.each do |tz_name, _|
        if tz_id.include?(tz_name.tr(' ', '_'))
          selected_name = tz_name
        end
        all_tz.delete(tz_name)
      end
      # rubocop:enable Style/HashEachMethods
      all_tz[selected_name] = tz_id
    end
    all_tz
  end.freeze

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
  end

  ALL_STATES_RAW = [
    WCA_COUNTRIES,
    MULTIPLE_COUNTRIES,
  ].flatten.freeze

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
