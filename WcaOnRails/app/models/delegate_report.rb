class DelegateReport < ActiveRecord::Base
  belongs_to :competition, required: true

  def posted?
    !!self.posted_at
  end
end
