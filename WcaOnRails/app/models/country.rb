# frozen_string_literal: true

class Country < ApplicationRecord
  include Cachable
  self.table_name = "Countries"

  MULTIPLE_COUNTRIES_IDS = %w(XA XE XS).freeze

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
    countries = I18nUtils.localized_sort_by!(locale, Country.all.to_a) { |country| country.name_in(locale) }
    [locale, countries]
  end].freeze

  def self.all_sorted_by(locale, real: false)
    real ? ALL_SORTED_BY_LOCALE[locale].select(&:real?) : ALL_SORTED_BY_LOCALE[locale]
  end
end
