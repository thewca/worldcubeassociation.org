class CompetitionDelegate < ActiveRecord::Base
  belongs_to :delegate, class_name: "User"
  belongs_to :competition
end
