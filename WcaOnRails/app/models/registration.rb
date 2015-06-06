class Registration < ActiveRecord::Base
  self.table_name = "Preregs"

  belongs_to :competition, foreign_key: "competitionId"
end
