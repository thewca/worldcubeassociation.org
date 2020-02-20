# frozen_string_literal: true

class Subscription < ApplicationRecord
  belongs_to :user
  validates_presence_of :user

  enum championship: [ :world, :continental, :greater_china, :national ]

  def has_region_filter
    region_id != '' and region_id != nil
  end

  def has_region_filter=(new_has_region_filter)
    unless ActiveModel::Type::Boolean.new.cast(new_has_region_filter)
      self.region_id = ''
    end
  end

  def has_location_filter
    latitude != nil && longitude != nil && distance_km != nil
  end

  def has_location_filter=(new_has_location_filter)
    unless ActiveModel::Type::Boolean.new.cast(new_has_location_filter)
      self.latitude = nil
      self.longitude = nil
      self.distance_km = nil
    end
  end

  def has_championship_filter
    championship != '' and championship != nil
  end

  def has_championship_filter=(new_has_championship_filter)
    unless ActiveModel::Type::Boolean.new.cast(new_has_championship_filter)
      self.championship = ''
    end
  end

  def has_date_filter
    start_date > Date.new(1970, 1, 1) || end_date < Date.new(9999, 12, 31)
  end

  def has_date_filter=(new_has_date_filter)
    unless ActiveModel::Type::Boolean.new.cast(new_has_date_filter)
      self.start_date = Date.new(1970, 1, 1)
      self.end_date = Date.new(9999, 12, 31)
    end
  end

  def has_event_filter
    event_id != '' and event_id != nil
  end

  def has_event_filter=(new_has_event_filter)
    unless ActiveModel::Type::Boolean.new.cast(new_has_event_filter)
      event_id = ''
    end
  end

  before_validation :maybe_destroy_if_empty
  private def maybe_destroy_if_empty
    unless has_region_filter or has_location_filter or has_championship_filter or has_date_filter or has_event_filter
      self.destroy
    end
  end

  alias_attribute :latitude_microdegrees, :latitude
  alias_attribute :longitude_microdegrees, :longitude

  def longitude_degrees
    longitude_microdegrees ? longitude_microdegrees / 1e6 : nil
  end

  def longitude_degrees=(new_longitude_degrees)
    @longitude_degrees = new_longitude_degrees.to_f
    self.longitude = @longitude_degrees * 1e6
  end

  def longitude_radians
    to_radians longitude_degrees
  end

  def latitude_degrees
    latitude_microdegrees ? latitude_microdegrees / 1e6 : nil
  end

  def latitude_degrees=(new_latitude_degrees)
    @latitude_degrees = new_latitude_degrees.to_f
    self.latitude = @latitude_degrees * 1e6
  end

  def latitude_radians
    to_radians latitude_degrees
  end
end
