class CompetitionTab < ActiveRecord::Base
  belongs_to :competition, required: true

  validates :name, presence: true

  CLONEABLE_ATTRIBUTES = %w(
    name
    content
    display_order
  ).freeze

  UNCLONEABLE_ATTRIBUTES = %w(
    id
    competition_id
  ).freeze

  def slug
    "#{id}-#{name.parameterize}"
  end

  after_create :set_display_order
  private def set_display_order
    update_column :display_order, competition.competition_tabs.count
  end

  after_destroy :fix_display_order
  private def fix_display_order
    competition.competition_tabs.where("display_order > ?", display_order).update_all("display_order = display_order - 1")
  end
end
