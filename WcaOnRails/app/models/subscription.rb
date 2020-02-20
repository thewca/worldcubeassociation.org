# frozen_string_literal: true

class Subscription < ApplicationRecord
  belongs_to :user
  validates_presence_of :user

  enum championship: [ :world, :continental, :greater_china, :national ]

  def has_region_filter?
    region_id != nil
  end

  def has_location_filter?
    latitude != nil && longitude != nil && distance_km != nil
  end

  def has_championship_filter?
    championship != nil
  end

  def has_date_filter?
    start_date > Date.new(1970, 1, 1) || end_date < Date.new(9999, 12, 31)
  end

  def has_event_filter?
    event_id != nil
  end

  alias_attribute :latitude_microdegrees, :latitude
  alias_attribute :longitude_microdegrees, :longitude

  def longitude_degrees
    longitude_microdegrees ? longitude_microdegrees / 1e6 : nil
  end

  def longitude_degrees=(new_longitude_degrees)
    @longitude_degrees = new_longitude_degrees.to_f
  end

  def longitude_radians
    to_radians longitude_degrees
  end

  def latitude_degrees
    latitude_microdegrees ? latitude_microdegrees / 1e6 : nil
  end

  def latitude_degrees=(new_latitude_degrees)
    @latitude_degrees = new_latitude_degrees.to_f
  end

  def latitude_radians
    to_radians latitude_degrees
  end
end
