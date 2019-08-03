# frozen_string_literal: true

class DelegateReport < ApplicationRecord
  REPORTS_ENABLED_DATE = Date.new(2016, 6, 1)

  belongs_to :competition
  belongs_to :posted_by_user, class_name: "User"

  attr_accessor :current_user

  before_create :set_discussion_url
  def set_discussion_url
    self.discussion_url = "https://groups.google.com/a/worldcubeassociation.org/forum/#!topicsearchin/reports/" + URI.encode_www_form_component(competition.name)
  end

  before_create :equipment_default
  def equipment_default
    self.equipment = "Gen 2 Timer: 0
Gen 3 Pro Timer: 0
Gen 4 Pro Timer: 0

Gen 2 Display: 0
Gen 3 Display: 0"
  end

  validates :schedule_url, presence: true, if: :schedule_and_disussion_urls_required?
  validates :schedule_url, url: true
  validates :discussion_url, presence: true, if: :schedule_and_disussion_urls_required?
  validates :discussion_url, url: true
  validates :wrc_incidents, presence: true, if: :wrc_feedback_requested
  validates :wdc_incidents, presence: true, if: :wdc_feedback_requested

  def schedule_and_disussion_urls_required?
    posted? && created_at > Date.new(2019, 7, 21)
  end

  def posted?
    !!posted_at
  end

  def posted=(new_posted)
    new_posted = ActiveRecord::Type::Boolean.new.cast(new_posted)
    self.posted_at = (new_posted ? Time.now : nil)
    self.posted_by_user_id = current_user&.id
  end
end
