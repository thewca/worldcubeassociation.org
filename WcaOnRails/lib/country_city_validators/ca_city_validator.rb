# frozen_string_literal: true

module CountryCityValidators
  CA_PROVINCES = %w(
    Alberta
    British\ Columbia
    Manitoba
    New\ Brunswick
    Newfoundland\ and\ Labrador
    Nova\ Scotia
    Ontario
    Prince\ Edward\ Island
    Quebec
    Saskatchewan
  ).to_set

  CA_TERRITORIES = %w(
    Northwest\ Territories
    Nunavut
    Yukon
  )

  class CaCityValidator < CityCommaRegionValidator
    def initialize
      super(type_of_region: "province", valid_regions: (CA_PROVINCES | CA_TERRITORIES))
    end

    def self.country_iso_2
      "CA"
    end
  end
end
