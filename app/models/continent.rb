# frozen_string_literal: true

class Continent < ApplicationRecord
  self.table_name = "Continents"
  NAME_LOOKUP_ATTRIBUTE = :name
  FICTIVE_IDS = ["_Multiple Continents"].freeze

  include Cachable
  include LocalizedSortable
  include StaticData

  REAL_CONTINENTS = self.all_raw.select { |c| !FICTIVE_IDS.include?(c[:id]) }.freeze
  REAL_CONTINENT_IDS = REAL_CONTINENTS.pluck(:id).freeze

  has_many :countries, foreign_key: :continentId

  alias_attribute :record_name, :recordName

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
