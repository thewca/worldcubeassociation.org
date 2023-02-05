# frozen_string_literal: true

module CountryCityValidators
  US_STATES = %w(
    Alabama
    Alaska
    Arizona
    Arkansas
    California
    Colorado
    Connecticut
    Delaware
    Florida
    Georgia
    Hawaii
    Idaho
    Illinois
    Indiana
    Iowa
    Kansas
    Kentucky
    Louisiana
    Maine
    Maryland
    Massachusetts
    Michigan
    Minnesota
    Mississippi
    Missouri
    Montana
    Nebraska
    Nevada
    New\ Hampshire
    New\ Jersey
    New\ Mexico
    New\ York
    North\ Carolina
    North\ Dakota
    Ohio
    Oklahoma
    Oregon
    Pennsylvania
    Rhode\ Island
    South\ Carolina
    South\ Dakota
    Tennessee
    Texas
    Utah
    Vermont
    Virginia
    Washington
    West\ Virginia
    Wisconsin
    Wyoming
  ).to_set

  US_TERRITORIES = %w(
    American\ Samoa
    Guam
    Northern\ Mariana\ Islands
    Puerto\ Rico
    U.S.\ Virgin\ Islands
  ).to_set

  class UsCityValidator < CityCommaRegionValidator
    def initialize
      super(type_of_region: "state", valid_regions: (US_STATES | US_TERRITORIES))
    end

    def self.country_iso_2
      "US"
    end
  end
end
