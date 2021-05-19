# frozen_string_literal: true

class CityValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return if record.country.nil? || value.blank?

    if value == "Multiple cities"
      # This is a very special city name used for simultaneous FMC competitions
      # such as FMC USA. See https://github.com/thewca/worldcubeassociation.org/issues/3355.
      return
    end

    city_validator = self.class.get_validator_for_country(record.country.iso2)
    if city_validator
      reason_why_invalid = city_validator.reason_why_invalid(value)
      record.errors.add(attribute, reason_why_invalid) if reason_why_invalid
    end
  end

  @validators_by_country_iso2 = {}

  def self.add_validator_for_country(country_iso2, validator)
    @validators_by_country_iso2[country_iso2] = validator
  end

  def self.get_validator_for_country(country_iso2)
    @validators_by_country_iso2[country_iso2]
  end
end

class CountryCityValidator
  # A CountryCityValidator has this one method: `reason_why_invalid` that takes
  # in a city name, and returns a string reason why that name is not valid, or
  # nil if the name is valid.
  def reason_why_invalid(city)
    raise NotImplementedError
  end
end

class CityCommaRegionValidator < CountryCityValidator
  attr_reader :valid_regions
  def initialize(type_of_region:, valid_regions:)
    @type_of_region = type_of_region
    @valid_regions = valid_regions
  end

  def reason_why_invalid(city)
    _city, region = city.split(", ", 2)
    if region.nil?
      "is not of the form 'city, #{@type_of_region}'"
    elsif !@valid_regions.include?(region)
      "#{region} is not a valid #{@type_of_region}"
    else
      nil
    end
  end
end

# Load all the country city validators.
Dir[File.join(__dir__, 'country_city_validators', '*.rb')].sort.each { |file| require file }
