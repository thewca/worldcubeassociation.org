# frozen_string_literal: true

class Continent < ReadonlyRecord
  self.table_name = "Continents"
  NAME_LOOKUP_ATTRIBUTE = :name
  FICTIVE_IDS = ["_Multiple Continents"].freeze

  include Cachable
  include LocalizedSortable

  has_many :countries, foreign_key: :continentId

  alias_attribute :record_name, :recordName

  def self.country_ids(continent_id)
    c_all_by_id[continent_id]&.countries&.map(&:id)
  end

  def self.country_iso2s(continent_id)
    c_all_by_id[continent_id]&.countries&.map(&:iso2)
  end
end
