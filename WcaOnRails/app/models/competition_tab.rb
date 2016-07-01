class CompetitionTab < ActiveRecord::Base
  belongs_to :competition, required: true

  validates :name, presence: true
  validates :display_order, uniqueness: { scope: :competition_id }

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

  def reorder(direction)
    current_display_order = display_order
    other_display_order = display_order + (direction.to_s == "up" ? -1 : 1)
    other_tab = competition.competition_tabs.find_by(display_order: other_display_order)
    if other_tab
      update_column :display_order, nil
      other_tab.update_column :display_order, current_display_order
      update_column :display_order, other_display_order
    end
  end
end
