# frozen_string_literal: true

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

CityValidator.add_validator_for_country "AU", CityCommaRegionValidator.new(type_of_region: "state/territory", valid_regions: AU_STATES)
