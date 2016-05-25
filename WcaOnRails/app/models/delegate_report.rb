class DelegateReport < ActiveRecord::Base
  belongs_to :competition, required: true

  def posted?
    !!posted_at
  end

  def posted=(new_posted)
    self.posted_at = (new_posted ? Time.now : nil)
  end
end
