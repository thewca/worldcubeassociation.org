# frozen_string_literal: true

class VenueRoom < ApplicationRecord
  belongs_to :schedule_venue
  has_one :competition_schedule, through: :schedule_venue
  delegate :start_time, to: :competition_schedule
  delegate :end_time, to: :competition_schedule
  has_many :schedule_activities, as: :holder

  validates_presence_of :name
  validates_numericality_of :wcif_id, only_integer: true

  def to_wcif
    {
      "id" => wcif_id,
      "name" => name,
      "activities" => schedule_activities.map(&:to_wcif),
    }
  end
end
