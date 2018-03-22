# frozen_string_literal: true

class ScheduleActivity < ApplicationRecord
  belongs_to :holder, polymorphic: true
  has_many :children_activities, class_name: "ScheduleActivity", as: :holder

  validates_presence_of :name
  validates_numericality_of :wcif_id, only_integer: true
  # TODO: activity code validation
  # TODO: we don't yet care for scramble_set_id
  validate :included_in_parent_schedule

  def included_in_parent_schedule
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

  def to_wcif
    {
      "id" => wcif_id,
      "name" => name,
      "activityCode" => activity_code,
      "childActivities" => children_activities.map(&:to_wcif),
    }
  end
end
