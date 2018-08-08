# frozen_string_literal: true

class Continent < ApplicationRecord
  self.table_name = "Continents"
  NAME_LOOKUP_ATTRIBUTE = :name
  FICTIVE_IDS = ["_Multiple Continents"].freeze

  include Cachable
  include LocalizedSortable

  has_many :countries, foreign_key: :continentId

  def self.country_ids(continent_id)
    c_all_by_id[continent_id]&.countries&.map(&:id)
  end
end
