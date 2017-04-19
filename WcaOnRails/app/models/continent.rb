# frozen_string_literal: true

class Continent < ApplicationRecord
  include Cachable
  self.table_name = "Continents"

  has_many :countries, foreign_key: :continentId

  def self.country_ids(continent_id)
    c_all_by_id[continent_id]&.countries&.map(&:id)
  end

  def name
    I18n.t(recordName, scope: :continents)
  end

  def name_in(locale)
    I18n.t(recordName, scope: :continents, locale: locale)
  end

  ALL_SORTED_BY_LOCALE = Hash[I18n.available_locales.map do |locale|
    continents = I18nUtils.localized_sort_by!(locale, Continent.all.to_a) { |continent| continent.name_in(locale) }
    [locale, continents]
  end].freeze
end
