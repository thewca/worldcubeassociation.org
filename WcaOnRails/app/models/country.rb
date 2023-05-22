# frozen_string_literal: true

class Country < ApplicationRecord
  include Cachable
  WCA_STATES_JSON_PATH = Rails.root.to_s + "/config/wca-states.json"
  self.table_name = "Countries"

  ALL_TIMEZONES_MAPPING = begin
    all_tz = ActiveSupport::TimeZone::MAPPING
    grouped_tz = all_tz.group_by { |k, v| v }
    duplicates = grouped_tz.select { |k, v| v.size > 1 }
    duplicates.each do |tz_id, tz_entries|
      selected_name = tz_id
      # Try to be smarter here, and find the closest matching name
      tz_entries.each do |tz_name, _|
        if tz_id.include?(tz_name.tr(' ', '_'))
          selected_name = tz_name
        end
        all_tz.delete(tz_name)
      end
      all_tz[selected_name] = tz_id
    end
    all_tz
  end.freeze

  MULTIPLE_COUNTRIES = [
    { id: 'XF', name: 'Multiple Countries (Africa)', continentId: '_Africa', iso2: 'XF' },
    { id: 'XM', name: 'Multiple Countries (Americas)', continentId: '_Multiple Continents', iso2: 'XM' },
    { id: 'XA', name: 'Multiple Countries (Asia)', continentId: '_Asia', iso2: 'XA' },
    { id: 'XE', name: 'Multiple Countries (Europe)', continentId: '_Europe', iso2: 'XE' },
    { id: 'XN', name: 'Multiple Countries (North America)', continentId: '_North America', iso2: 'XN' },
    { id: 'XO', name: 'Multiple Countries (Oceania)', continentId: '_Oceania', iso2: 'XO' },
    { id: 'XS', name: 'Multiple Countries (South America)', continentId: '_South America', iso2: 'XS' },
    { id: 'XW', name: 'Multiple Countries (World)', continentId: '_Multiple Continents', iso2: 'XW' },
  ].freeze

  FICTIVE_IDS = MULTIPLE_COUNTRIES.map { |c| c[:id] }.freeze
  NAME_LOOKUP_ATTRIBUTE = :iso2
  include LocalizedSortable

  WCA_STATES = JSON.parse(File.read(WCA_STATES_JSON_PATH)).freeze

  ALL_STATES = [
    WCA_STATES["states_lists"].map do |list|
      list["states"].map do |state|
        state_id = state["id"] || I18n.transliterate(state["name"]).tr("'", "_")
        { id: state_id, continentId: state["continent_id"],
          iso2: state["iso2"], name: state["name"] }
      end
    end,
    MULTIPLE_COUNTRIES,
  ].flatten.map { |c| Country.new(c) }.freeze

  belongs_to :continent, foreign_key: :continentId
  alias_attribute :continent_id, :continentId
  has_many :competitions, foreign_key: :countryId
  has_one :band, foreign_key: :iso2, primary_key: :iso2, class_name: "CountryBand"

  def continent
    Continent.c_find(self.continentId)
  end

  def self.find_by_iso2(iso2)
    c_all_by_id.values.select { |c| c.iso2 == iso2 }.first
  end

  def multiple_countries?
    MULTIPLE_COUNTRIES.any? { |c| c[:id] == self.id }
  end
end
