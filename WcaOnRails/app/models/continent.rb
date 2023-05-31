# frozen_string_literal: true

class Continent < ApplicationRecord
  NAME_LOOKUP_ATTRIBUTE = :name
  FICTIVE_IDS = ["_Multiple Continents"].freeze

  include Cachable
  include LocalizedSortable

  has_many :countries

  def self.country_ids(continent_id)
    c_all_by_id[continent_id]&.countries&.map(&:id)
  end

  def self.country_iso2s(continent_id)
    c_all_by_id[continent_id]&.countries&.map(&:iso2)
  end
end
