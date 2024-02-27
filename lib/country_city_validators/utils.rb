# frozen_string_literal: true

module CountryCityValidators
  module Utils
    ALL_VALIDATORS = [
      ArCityValidator,
      AuCityValidator,
      BrCityValidator,
      CaCityValidator,
      GbCityValidator,
      InCityValidator,
      UsCityValidator,
    ].freeze
  end
end
