# frozen_string_literal: true

class DelegateReport < ApplicationRecord
  REPORTS_ENABLED_DATE = Date.new(2016, 6, 1)

  belongs_to :competition
  belongs_to :posted_by_user, class_name: "User", optional: true
  belongs_to :wrc_primary_user, class_name: "User", optional: true
  belongs_to :wrc_secondary_user, class_name: "User", optional: true

  attr_accessor :current_user

  before_create :set_discussion_url
  def set_discussion_url
    self.discussion_url = "https://groups.google.com/a/worldcubeassociation.org/forum/#!topicsearchin/reports/" + URI.encode_www_form_component(competition.name)
  end

  before_create :equipment_default
  def equipment_default
    self.equipment = ActionController::Base.new.render_to_string(template: "delegate_reports/_equipment_default", formats: :md)
  end

  before_create :venue_default
  def venue_default
    self.venue = ActionController::Base.new.render_to_string(template: "delegate_reports/_venue_default", formats: :md)
  end

  before_create :organization_default
  def organization_default
    self.organization = ActionController::Base.new.render_to_string(template: "delegate_reports/_organization_default", formats: :md)
  end

  before_create :incidents_default
  def incidents_default
    self.incidents = ActionController::Base.new.render_to_string(template: "delegate_reports/_incidents_default", formats: :md)
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

  def can_see_submit_button?(current_user)
    !posted? && competition.staff_delegates.include?(current_user)
  end

  def can_submit?(current_user)
    can_see_submit_button?(current_user) && (competition.results_submitted? || competition.results_posted?)
  end

  def posted=(new_posted)
    new_posted = ActiveRecord::Type::Boolean.new.cast(new_posted)
    self.posted_at = (new_posted ? Time.now : nil)
    self.posted_by_user_id = current_user&.id
  end
end
