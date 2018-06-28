# frozen_string_literal: true

class ScheduleActivity < ApplicationRecord
  # See https://docs.google.com/document/d/1hnzAZizTH0XyGkSYe-PxFL5xpKVWl_cvSdTzlT_kAs8/edit#heading=h.14uuu58hnua
  VALID_ACTIVITY_CODE_BASE = (Event.official.map(&:id) + %w(other)).freeze
  VALID_OTHER_ACTIVITY_CODE = %w(registration breakfast lunch dinner awards unofficial misc).freeze
  belongs_to :holder, polymorphic: true
  has_many :child_activities, class_name: "ScheduleActivity", as: :holder, dependent: :destroy

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
        errors.add(:activity_code, "should share its base activity id with parent")
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

  def to_event
    {
      title: ScheduleActivity.localized_name_from_activity_code(activity_code, name),
      roomId: holder.id,
      roomName: holder.name,
      activityCode: activity_code,
      start: start_time.in_time_zone(holder.competition_venue.timezone_id).iso8601,
      start_time: start_time.in_time_zone(holder.competition_venue.timezone_id),
      end: end_time.in_time_zone(holder.competition_venue.timezone_id).iso8601,
      end_time: end_time.in_time_zone(holder.competition_venue.timezone_id),
    }
  end

  def load_wcif!(wcif)
    update_attributes!(ScheduleActivity.wcif_to_attributes(wcif))
    new_child_activities = wcif["childActivities"].map do |activity_wcif|
      activity = child_activities.find { |a| a.wcif_id == activity_wcif["id"] } || child_activities.build
      activity.load_wcif!(activity_wcif)
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

  def self.parse_activity_code(activity_code)
    parts = activity_code.split("-");
    parts_hash = {
      event_id: parts.shift(),
      round_number: nil,
      group_number: nil,
      attempt_number: nil,
    }

    parts.each do |p|
      case p[0]
      when "a"
        parts_hash[:attempt_number] = p[1..-1].to_i
      when "g"
        parts_hash[:group_number] = p[1..-1].to_i
      when "r"
        parts_hash[:round_number] = p[1..-1].to_i
      end
    end
    parts_hash
  end

  def self.localized_name_from_activity_code(activity_code, fallback_name)
    parts = ScheduleActivity.parse_activity_code(activity_code)
    if parts[:event_id] == "other"
      # TODO: this
      #VALID_OTHER_ACTIVITY_CODE = %w(registration breakfast lunch dinner awards unofficial misc).freeze
      name = fallback_name
    else
      name = Event.c_find(parts[:event_id]).name
      if parts[:round_number]
        name = I18n.t("round.name", event: name, number: parts[:round_number])
      end
      if parts[:attempt_number]
        name += " #{I18n.t("attempts.attempt_name", number: parts[:attempt_number])}"
      end
      # FIXME: do group number
      name
    end
  end
end
