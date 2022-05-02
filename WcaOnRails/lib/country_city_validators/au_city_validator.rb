# frozen_string_literal: true

module CountryCityValidators
  AU_STATES = %w(
    Australian\ Capital\ Territory
    New\ South\ Wales
    Northern\ Territory
    Queensland
    South\ Australia
    Tasmania
    Victoria
    Western\ Australia
  ).to_set

  class AuCityValidator < CityCommaRegionValidator
    def initialize
      super(type_of_region: "state or territory", valid_regions: AU_STATES)
    end

    def self.country_iso_2
      "AU"
    end
  end
end
