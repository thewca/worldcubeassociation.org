# frozen_string_literal: true

module GeoCalculation
  module_function

  # Source http://www.movable-type.co.uk/scripts/latlong.html
  def haversine_distance(lat_rad_from, long_rad_from, lat_rad_to, long_rad_to)
    delta_lat = lat_rad_to - lat_rad_from
    delta_long = long_rad_to - long_rad_from

    a = (Math.sin(delta_lat / 2.0)**2) +
        (Math.cos(lat_rad_from) * Math.cos(lat_rad_to) * (Math.sin(delta_long / 2.0)**2))

    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    6371 * c
  end

  def to_radians(degrees)
    degrees * Math::PI / 180
  end
end
