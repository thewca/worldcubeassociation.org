# frozen_string_literal: true

class DelegateReport < ActiveRecord::Base
  belongs_to :competition, required: true
  belongs_to :posted_by_user, class_name: "User"

  attr_accessor :current_user

  before_create :set_discussion_url
  def set_discussion_url
    self.discussion_url = "https://groups.google.com/forum/#!topicsearchin/wca-delegates/" + URI.encode(competition.name)
  end

  before_create :equipment_default
  def equipment_default
    self.equipment = "Gen 2 Timer: 0
Gen 3 Pro Timer: 0
Gen 4 Pro Timer: 0

Gen 2 Display: 0
Gen 3 Display: 0"
  end

  URL_RE = %r{\Ahttps?://\S+\z}
  VALID_URL_MESSAGE = "must be a valid url starting with http:// or https://"
  validate :url_validations
  def url_validations
    if schedule_url.present? && !URL_RE.match(schedule_url)
      errors.add(:schedule_url, VALID_URL_MESSAGE)
    end

    if discussion_url.present? && !URL_RE.match(discussion_url)
      errors.add(:discussion_url, VALID_URL_MESSAGE)
    end
  end

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
    self.posted_by_user_id = current_user&.id
  end
end
