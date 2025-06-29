# frozen_string_literal: true

class ScheduleActivity < ApplicationRecord
  ACTIVITY_CODE_OTHER = 'other'
  # See https://docs.google.com/document/d/1hnzAZizTH0XyGkSYe-PxFL5xpKVWl_cvSdTzlT_kAs8/edit#heading=h.14uuu58hnua
  VALID_ACTIVITY_CODE_BASE = (Event::OFFICIAL_IDS + [ACTIVITY_CODE_OTHER]).freeze
  VALID_OTHER_ACTIVITY_CODE = %w[registration checkin multi breakfast lunch dinner awards unofficial misc tutorial setup teardown].freeze
  belongs_to :venue_room
  belongs_to :round, optional: true
  belongs_to :parent_activity, class_name: "ScheduleActivity", optional: true, inverse_of: :child_activities
  has_many :child_activities, class_name: "ScheduleActivity", foreign_key: :parent_activity_id, inverse_of: :parent_activity, dependent: :destroy
  has_many :wcif_extensions, as: :extendable, dependent: :delete_all
  has_many :assignments, dependent: :delete_all

  scope :root_activities, -> { where(parent_activity_id: nil) }

  validates :name, presence: true
  validates :wcif_id, numericality: { only_integer: true }, uniqueness: { scope: :venue_room_id }
  validates :start_time, presence: { allow_blank: false }
  validates :end_time, presence: { allow_blank: false }
  validates :activity_code, presence: { allow_blank: false }
  validates :round, presence: { if: :event_activity? }
  # TODO: we don't yet care for scramble_set_id
  delegate :color, to: :venue_room

  private def event_activity?
    self.parsed_activity_code[:event_id] != ACTIVITY_CODE_OTHER
  end

  validate :included_in_competition_dates
  def included_in_competition_dates
    errors.add(:start_time, "should be after competition's start_time") unless start_time >= venue_room.competition_start_time
    errors.add(:end_time, "should be before competition's end_time") unless end_time <= venue_room.competition_end_time
  end

  validate :included_in_parent_schedule, if: :parent_activity_id?
  def included_in_parent_schedule
    errors.add(:start_time, "should be after parent's start_time") unless start_time >= parent_activity.start_time
    errors.add(:end_time, "should be before parent's end_time") unless end_time <= parent_activity.end_time
  end

  validate :start_before_end
  def start_before_end
    errors.add(:end_time, "should be after start_time") unless start_time <= end_time
  end

  validate :valid_activity_code
  def valid_activity_code
    return if errors.present?

    activity_id = activity_code.split('-').first
    errors.add(:activity_code, "should be a valid activity code") unless VALID_ACTIVITY_CODE_BASE.include?(activity_id)
    if activity_id == "other"
      other_id = activity_code.split('-').second
      errors.add(:activity_code, "is an invalid 'other' activity code") unless VALID_OTHER_ACTIVITY_CODE.include?(other_id)
    end

    return if parent_activity.blank?

    parent_activity_id = parent_activity.activity_code.split('-').first
    errors.add(:activity_code, "should share its base activity id with parent") unless activity_id == parent_activity_id
  end

  validate :consistent_round_information, if: :round_id?
  def consistent_round_information
    parts = self.parsed_activity_code

    errors.add(:activity_code, "event should match the selected round") if parts[:event_id] != round.event_id
    errors.add(:activity_code, "round number should match the selected round") if parts[:round_number].present? && (parts[:round_number] != round.number)

    # TODO: We normally want this validation, but it messes with established "workflows" of Delegates
    #   who want to sync in-progress schedules or experiment with external group assignment tools
    #   while at the same time not wanting to constantly switch to the "Edit Events" page to update the scramble set number
    # See also https://github.com/thewca/worldcubeassociation.org/issues/11654 fpr details
    # errors.add(:activity_code, "group should not be larger than the number of scramble sets") if parts[:group_number].present? && (parts[:group_number] > round.scramble_set_count)

    errors.add(:activity_code, "attempt number should not be larger than the number of expected attempts") if parts[:attempt_number].present? && (parts[:attempt_number] > round.format.expected_solve_count)
  end

  # Name can be specified externally, but we may want to infer the activity name
  # from its activity code (eg: if it's for an event or round).
  def localized_name
    parts = self.parsed_activity_code
    if parts[:event_id] == ACTIVITY_CODE_OTHER
      # TODO/NOTE: should we fix the name for event with predefined activity codes? (ie: those below but 'misc' and 'unofficial')
      # VALID_OTHER_ACTIVITY_CODE = %w(registration checkin multi breakfast lunch dinner awards unofficial misc).freeze
      self.name
    else
      inferred_name = round&.name || Event.c_find(parts[:event_id]).name
      inferred_name += " (#{I18n.t('attempts.attempt_name', number: parts[:attempt_number])})" if parts[:attempt_number]
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

  def root_activity
    parent_activity&.root_activity || self
  end

  def parsed_activity_code
    ScheduleActivity.parse_activity_code(self.activity_code)
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

  def to_event
    raise "#to_event called for nested activity" unless parent_activity.nil?

    {
      title: localized_name,
      roomId: venue_room_id,
      roomName: venue_room.name,
      venueName: venue_room.competition_venue.name,
      color: color,
      activityDetails: parsed_activity_code,
      start: start_time.in_time_zone(venue_room.competition_venue.timezone_id),
      end: end_time.in_time_zone(venue_room.competition_venue.timezone_id),
    }
  end

  def load_wcif!(wcif, venue_room, parent_activity: nil)
    wcif_attributes = ScheduleActivity.wcif_to_attributes(wcif)

    self.assign_attributes(wcif_attributes.slice(:activity_code))
    round = parent_activity&.round || self.find_matched_round(venue_room)

    update!(
      venue_room: venue_room,
      parent_activity: parent_activity,
      round: round,
      **wcif_attributes,
    )
    new_child_activities = wcif["childActivities"].map do |activity_wcif|
      activity = child_activities.find { |a| a.wcif_id == activity_wcif["id"] } || child_activities.build
      activity.load_wcif!(activity_wcif, venue_room, parent_activity: self)
    end
    self.child_activities = new_child_activities
    WcifExtension.update_wcif_extensions!(self, wcif["extensions"]) if wcif["extensions"]
    self
  end

  private def find_matched_round(override_venue_room = nil)
    linked_venue_room = override_venue_room || self.venue_room

    # Using `find` instead of `find_by` throughout to leverage preloaded associations
    competition_event = linked_venue_room.competition.competition_events.find { it.event_id == self.parsed_activity_code[:event_id] }
    return nil if competition_event.blank?

    competition_event.rounds.find { it.number == self.parsed_activity_code[:round_number] }
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
      "required" => %w[id name activityCode startTime endTime childActivities],
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
