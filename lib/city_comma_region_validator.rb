# frozen_string_literal: true

class CityCommaRegionValidator < CountryCityValidator
  attr_reader :valid_regions

  def initialize(type_of_region:, valid_regions:)
    super()

    @type_of_region = type_of_region
    @valid_regions = valid_regions
  end

  def reason_why_invalid(city)
    _city, region = city.split(', ', 2)
    if region.nil?
      "is not of the form 'city, #{@type_of_region}'"
    elsif !@valid_regions.include?(region)
      "#{region} is not a valid #{@type_of_region}"
    else
      nil
    end
  end
end
