# frozen_string_literal: true

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

CityValidator.add_validator_for_country "CA", CityCommaRegionValidator.new(type_of_region: "province", valid_regions: CA_PROVINCES)
