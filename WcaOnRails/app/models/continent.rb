class Continent < ActiveRecord::Base
  self.table_name = "Continents"

  ALL_CONTINENTS_WITH_NAME_AND_ID = Continent.all.map { |continent| [continent.name, continent.id] }
end
