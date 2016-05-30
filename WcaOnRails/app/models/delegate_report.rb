class DelegateReport < ActiveRecord::Base
  belongs_to :competition, required: true

  validate :only_post_after_competition
  def only_post_after_competition
    if posted? && !can_be_posted?
      errors.add(:posted, "cannot be posted yet")
    end
  end

  def can_be_posted?
    competition.is_over?
  end

  def posted?
    !!posted_at
  end

  def posted=(new_posted)
    self.posted_at = (new_posted ? Time.now : nil)
  end
end
