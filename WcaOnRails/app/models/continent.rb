# frozen_string_literal: true
class Continent < ActiveRecord::Base
  self.table_name = "Continents"

  has_many :countries, foreign_key: :continentId
end
