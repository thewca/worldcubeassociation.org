# frozen_string_literal: true
class Country < ActiveRecord::Base
  include Cachable
  self.table_name = "Countries"

  belongs_to :continent, foreign_key: :continentId
  has_many :competitions, foreign_key: :countryId

  scope :uncached_real, -> { where("name not like 'Multiple Countries%'") }

  def name
    I18n.t(iso2, scope: :countries)
  end

  def name_in(locale)
    I18n.t(iso2, scope: :countries, locale: locale)
  end

  def self.real
    @@real_countries ||= Country.uncached_real
  end

  def self.find_by_iso2(iso2)
    c_all_by_id.values.select { |c| c.iso2 == iso2 }.first
  end

  COMPARE_LOCALIZED_NAMES = lambda do |locale, a, b|
    # We have transformations to apply on the names before we compare them,
    # they depend on the locale, and the default is to transliterate them.
    name_a, name_b = if locale == :"zh-CN"
                       [a.first.encode(Encoding::GBK), b.first.encode(Encoding::GBK)]
                     else
                       # We transliterate names so that country/continents starting with accent
                       # don't end up at the very bottom of the list because of the accents
                       [I18n.transliterate(a.first), I18n.transliterate(b.first)]
                     end
    name_a <=> name_b
  end

  ALL_COUNTRIES_WITH_NAME_AND_ID_BY_LOCALE = Hash[I18n.available_locales.map do |locale|
    [locale, Country.all.map do |country|
      # We want a localized country name, but a constant id across languages
      # NOTE: it means "search" will behave weirdly as it still searches by English
      # name (eg: searching for "Tunisie" in French won't match competitions in
      # "Tunisia" even if the country displayed is actually "Tunisie"...)
      [country.name_in(locale), country.id]
      # Now we want to sort countries according to their localized name
    end.sort!(&COMPARE_LOCALIZED_NAMES.curry[locale])]
  end].freeze
end
