class CompetitionTab < ActiveRecord::Base
  belongs_to :competition, required: true

  validates :name, presence: true

  CLONEABLE_ATTRIBUTES = %w(
    name
    content
  ).freeze

  UNCLONEABLE_ATTRIBUTES = %w(
    id
    competition_id
  ).freeze

  def slug
    "#{id}-#{name.parameterize}"
  end
end
