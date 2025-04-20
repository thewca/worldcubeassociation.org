# frozen_string_literal: true

class Continent < ApplicationRecord
  NAME_LOOKUP_ATTRIBUTE = :name
  FICTIVE_IDS = ["_Multiple Continents"].freeze

  include Cachable
  include LocalizedSortable
  include StaticData

  REAL_CONTINENTS = self.all_raw.select { |c| FICTIVE_IDS.exclude?(c[:id]) }.freeze
  REAL_CONTINENT_IDS = REAL_CONTINENTS.pluck(:id).freeze

  has_many :countries

  def url_id
    self.name_in(:en).parameterize.underscore.downcase
  end

  def self.country_ids(continent_id)
    c_find(continent_id)&.countries&.map(&:id)
  end

  def self.country_iso2s(continent_id)
    c_find(continent_id)&.countries&.map(&:iso2)
  end
end
