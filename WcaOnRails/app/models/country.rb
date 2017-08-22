# frozen_string_literal: true

class Country < ApplicationRecord
  include Cachable
  WCA_STATES_JSON_PATH = Rails.root.to_s + "/config/wca-states.json"
  self.table_name = "Countries"

  MULTIPLE_COUNTRIES = [
    { id: 'XA', name: 'Multiple Countries (Asia)', continentId: '_Asia', iso2: 'XA' },
    { id: 'XE', name: 'Multiple Countries (Europe)', continentId: '_Europe', iso2: 'XE' },
    { id: 'XS', name: 'Multiple Countries (South America)', continentId: '_South America', iso2: 'XS' },
    { id: 'XM', name: 'Multiple Countries (Americas)', continentId: '_Multiple Countries', iso2: 'XM' },
  ].freeze

  MULTIPLE_COUNTRIES_IDS = MULTIPLE_COUNTRIES.map { |c| c[:id] }.freeze

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
  has_many :competitions, foreign_key: :countryId

  scope :uncached_real, -> { where.not(id: MULTIPLE_COUNTRIES_IDS) }

  def name
    I18n.t(iso2, scope: :countries)
  end

  def name_in(locale)
    I18n.t(iso2, scope: :countries, locale: locale)
  end

  def self.real
    @real_countries ||= Country.uncached_real
  end

  def real?
    !MULTIPLE_COUNTRIES_IDS.include?(id)
  end

  def self.find_by_iso2(iso2)
    c_all_by_id.values.select { |c| c.iso2 == iso2 }.first
  end

  ALL_SORTED_BY_LOCALE = Hash[I18n.available_locales.map do |locale|
    countries = I18nUtils.localized_sort_by!(locale, ALL_STATES.dup) { |country| country.name_in(locale) }
    [locale, countries]
  end].freeze

  def self.all_sorted_by(locale, real: false)
    real ? ALL_SORTED_BY_LOCALE[locale].select(&:real?) : ALL_SORTED_BY_LOCALE[locale]
  end
end
