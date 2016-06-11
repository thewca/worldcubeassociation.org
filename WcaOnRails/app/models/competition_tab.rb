class CompetitionTab < ActiveRecord::Base
  belongs_to :competition, required: true

  validates :name, presence: true
end
