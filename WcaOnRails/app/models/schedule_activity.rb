# frozen_string_literal: true

class ScheduleActivity < ApplicationRecord
  # See https://docs.google.com/document/d/1hnzAZizTH0XyGkSYe-PxFL5xpKVWl_cvSdTzlT_kAs8/edit#heading=h.14uuu58hnua
  VALID_ACTIVITY_CODE_BASE = (Event.official.map(&:id) + %w(other)).freeze
  VALID_OTHER_ACTIVITY_CODE = %w(registration checkin multi breakfast lunch dinner awards unofficial misc tutorial).freeze
  belongs_to :holder, polymorphic: true
  has_many :child_activities, class_name: "ScheduleActivity", as: :holder, dependent: :destroy
  has_many :wcif_extensions, as: :extendable, dependent: :delete_all
  has_many :assignments, dependent: :delete_all

  validates_presence_of :name
  validates_numericality_of :wcif_id, only_integer: true
  validates_presence_of :start_time, allow_blank: false
  validates_presence_of :end_time, allow_blank: false
  validates_presence_of :activity_code, allow_blank: false
  # TODO: we don't yet care for scramble_set_id
  validate :included_in_parent_schedule
  validate :valid_activity_code
  delegate :color, to: :holder

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

  # Name can be specified externally, but we may want to infer the activity name
  # from its activity code (eg: if it's for an event or round).
  def localized_name(rounds_by_wcif_id = {})
    parts = ScheduleActivity.parse_activity_code(activity_code)
    if parts[:event_id] == "other"
      # TODO/NOTE: should we fix the name for event with predefined activity codes? (ie: those below but 'misc' and 'unofficial')
      # VALID_OTHER_ACTIVITY_CODE = %w(registration checkin multi breakfast lunch dinner awards unofficial misc).freeze
      name
    else
      inferred_name = Event.c_find(parts[:event_id]).name
      round = rounds_by_wcif_id["#{parts[:event_id]}-r#{parts[:round_number]}"]
      if round
        inferred_name = round[:name]
      end
      if parts[:attempt_number]
        inferred_name += " (#{I18n.t("attempts.attempt_name", number: parts[:attempt_number])})"
      end
      inferred_name
    end
  end

  # Get this activity's activity_code and all of its nested activities
  # NOTE: as is, the WCA schedule editor doesn't support nested activities, but this
  # doesn't prevent anyone from submitting a WCIF with 333fm-a1 nested in 333fm (for instance).
  def all_activity_codes
    [activity_code, child_activities.map(&:all_activity_codes)].flatten
  end

  def all_activities
    [self, child_activities.map(&:all_activities)].flatten
  end

  def to_wcif
    {
      "id" => wcif_id,
      "name" => name,
      "activityCode" => activity_code,
      "startTime" => start_time.iso8601,
      "endTime" => end_time.iso8601,
      "childActivities" => child_activities.map(&:to_wcif),
      "extensions" => wcif_extensions.map(&:to_wcif),
    }
  end

  # TODO: not a fan of how it works (= passing round information)
  def to_event(rounds_by_wcif_id = {})
    raise "#to_event called for nested activity" unless holder.is_a?(VenueRoom)
    {
      title: localized_name(rounds_by_wcif_id),
      roomId: holder.id,
      roomName: holder.name,
      venueName: holder.competition_venue.name,
      color: color,
      activityDetails: ScheduleActivity.parse_activity_code(activity_code),
      start: start_time.in_time_zone(holder.competition_venue.timezone_id),
      end: end_time.in_time_zone(holder.competition_venue.timezone_id),
    }
  end

  def load_wcif!(wcif)
    update!(ScheduleActivity.wcif_to_attributes(wcif))
    new_child_activities = wcif["childActivities"].map do |activity_wcif|
      activity = child_activities.find { |a| a.wcif_id == activity_wcif["id"] } || child_activities.build
      activity.load_wcif!(activity_wcif)
    end
    self.child_activities = new_child_activities
    WcifExtension.update_wcif_extensions!(self, wcif["extensions"]) if wcif["extensions"]
    self
  end

  def move_by(diff)
    # 'diff' must be something add-able to a date (eg: 2.days, 34.seconds)
    self.assign_attributes(start_time: start_time + diff, end_time: end_time + diff)
    self.save(validate: false)
    child_activities.map { |a| a.move_by(diff) }
  end

  def move_to(date)
    self.assign_attributes(start_time: start_time.change(year: date.year, month: date.month, day: date.day),
                           end_time: end_time.change(year: date.year, month: date.month, day: date.day))
    self.save(validate: false)
    child_activities.map { |a| a.move_to(date) }
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
        "extensions" => { "type" => "array", "items" => WcifExtension.wcif_json_schema },
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
    parts = activity_code.split("-")
    parts_hash = {
      event_id: parts.shift,
      round_number: nil,
      group_number: nil,
      attempt_number: nil,
    }

    parts.each do |p|
      case p[0]
      when "a"
        parts_hash[:attempt_number] = p[1..].to_i
      when "g"
        parts_hash[:group_number] = p[1..].to_i
      when "r"
        parts_hash[:round_number] = p[1..].to_i
      end
    end
    parts_hash
  end
end
