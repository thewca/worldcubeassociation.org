class Person < ActiveRecord::Base
  self.table_name = "Persons"
  self.primary_key = "id"
end
