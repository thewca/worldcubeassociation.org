class Competition < ActiveRecord::Base
  self.table_name = "Competitions"
  validates :name, length: { maximum: 50 }
end
