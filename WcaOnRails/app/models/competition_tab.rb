class CompetitionTab < ActiveRecord::Base
  belongs_to :competition, required: true
end
