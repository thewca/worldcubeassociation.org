# frozen_string_literal: true
class Continent < ActiveRecord::Base
  self.table_name = "Continents"

  has_many :countries, foreign_key: :continentId

  ALL_CONTINENTS_WITH_NAME_AND_ID = Continent.all.map { |continent| [continent.name, continent.id] }
end
