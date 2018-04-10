# frozen_string_literal: true

class ScheduleActivity < ApplicationRecord
  # See https://docs.google.com/document/d/1hnzAZizTH0XyGkSYe-PxFL5xpKVWl_cvSdTzlT_kAs8/edit#heading=h.14uuu58hnua
  VALID_ACTIVITY_CODE_BASE = (Event.official.map(&:id) + %w(other)).freeze
  VALID_OTHER_ACTIVITY_CODE = %w(registration breakfast lunch dinner awards unofficial misc)
  belongs_to :holder, polymorphic: true
  has_many :child_activities, class_name: "ScheduleActivity", as: :holder, dependent: :destroy

  accepts_nested_attributes_for :child_activities, allow_destroy: true

  validates_presence_of :name
  validates_numericality_of :wcif_id, only_integer: true
  validates_presence_of :start_time, allow_blank: false
  validates_presence_of :end_time, allow_blank: false
  validates_presence_of :holder, allow_blank: false
  validates_presence_of :activity_code, allow_blank: false
  # TODO: we don't yet care for scramble_set_id
  validate :included_in_parent_schedule
  validate :valid_activity_code

  def included_in_parent_schedule
    return unless errors.blank?

    unless start_time >= holder.start_time
      errors.add(:start_time, "should be after parent's start_time")
    end
    unless end_time <= holder.end_time
      errors.add(:end_time, "should be before parent's end_time")
    end
    unless start_time <= end_time
      errors.add(:end_time, "should be after start_time")
    end
  end

  def valid_activity_code
    return unless errors.blank?

    activity_id = activity_code.split('-').first
    unless VALID_ACTIVITY_CODE_BASE.include?(activity_id)
      errors.add(:activity_code, "should be a valid activity code")
    end
    if activity_id == "other"
      other_id = activity_code.split('-').second
      unless VALID_OTHER_ACTIVITY_CODE.include?(other_id)
        errors.add(:activity_code, "is an invalid 'other' activity code")
      end
    end

    if holder.has_attribute?(:activity_code)
      holder_activity_id = holder.activity_code.split('-').first
      unless activity_id == holder_activity_id
        errors.add(:activity_code, "should its base activity id with parent")
      end
    end
  end

  def to_wcif
    {
      "id" => wcif_id,
      "name" => name,
      "activityCode" => activity_code,
      "startTime" => start_time.iso8601,
      "endTime" => end_time.iso8601,
      "childActivities" => child_activities.map(&:to_wcif),
    }
  end

  def load_wcif!(wcif)
    update_attributes!(ScheduleActivity.wcif_to_attributes(wcif))
    new_child_activities = wcif["childActivities"].map do |activity_wcif|
      activity = child_activities.find { |a| a.wcif_id == activity_wcif["id"] } || child_activities.build
      activity.load_wcif!(activity_wcif)
      activity
    end
    self.child_activities = new_child_activities
    self
  end

  def self.wcif_json_schema
    {
      "type" => "object",
      "id" => "activity",
      "properties" => {
        "id" => { "type" => "integer" },
        "name" => { "type" => "string" },
        "activityCode" => { "type" => "string" },
        "startTime" => { "type" => "string" },
        "endTime" => { "type" => "string" },
        "childActivities" => { "type" => "array", "items" => { "$ref" => "activity" } },
      },
      "required" => ["id", "name", "activityCode", "startTime", "endTime", "childActivities"],
    }
  end

  def self.wcif_to_attributes(wcif)
    {
      wcif_id: wcif["id"],
      name: wcif["name"],
      activity_code: wcif["activityCode"],
      start_time: wcif["startTime"],
      end_time: wcif["endTime"],
    }
  end
end
