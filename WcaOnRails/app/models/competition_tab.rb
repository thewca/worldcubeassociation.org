class CompetitionTab < ActiveRecord::Base
  belongs_to :competition, required: true

  validates :name, presence: true

  def slug
    "#{id}-#{name.parameterize}"
  end
end
