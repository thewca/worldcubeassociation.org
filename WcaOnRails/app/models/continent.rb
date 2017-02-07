# frozen_string_literal: true
class Continent < ActiveRecord::Base
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

  ALL_CONTINENTS_WITH_NAME_AND_ID_BY_LOCALE = Hash[I18n.available_locales.map do |locale|
    continents = Country.localized_sort_by!(locale, Continent.all.map do |country|
      # We want a localized continent name, but a constant id across languages
      [country.name_in(locale), country.id]
      # Now we want to sort continents according to their localized name
    end) { |localized_name, _id| localized_name }

    [locale, continents]
  end].freeze
end
