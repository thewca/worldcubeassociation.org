# frozen_string_literal: true

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

CityValidator.add_validator_for_country "IN", CityCommaRegionValidator.new(type_of_region: "state", valid_regions: IN_STATES)
