# frozen_string_literal: true

module CountryCityValidators
  IN_STATES = %w(
    Andaman\ and\ Nicobar\ Islands
    Andhra\ Pradesh
    Arunachal\ Pradesh
    Assam
    Bihar
    Chandigarh
    Chhattisgarh
    Dadra\ and\ Nagar\ Haveli
    Daman\ and\ Diu
    Delhi
    Goa
    Gujarat
    Haryana
    Himachal\ Pradesh
    Jammu\ and\ Kashmir
    Jharkhand
    Karnataka
    Kerala
    Lakshadweep
    Madhya\ Pradesh
    Maharashtra
    Manipur
    Meghalaya
    Mizoram
    Nagaland
    Odisha
    Puducherry
    Punjab
    Rajasthan
    Sikkim
    Tamil\ Nadu
    Telangana
    Tripura
    Uttar\ Pradesh
    Uttarakhand
    West\ Bengal
  ).to_set

  class InCityValidator < CityCommaRegionValidator
    def initialize
      super(type_of_region: 'state', valid_regions: IN_STATES)
    end

    def self.country_iso_2
      'IN'
    end
  end
end
