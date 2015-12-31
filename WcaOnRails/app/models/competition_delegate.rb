class CompetitionDelegate < ActiveRecord::Base
  belongs_to :delegate, class_name: "User"
  validates_presence_of :delegate

  belongs_to :competition
  validates_presence_of :competition
end
