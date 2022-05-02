# frozen_string_literal: true

class CountryCityValidator
  # A CountryCityValidator has this method: `reason_why_invalid` that takes
  # in a city name, and returns a string reason why that name is not valid, or
  # nil if the name is valid.
  def reason_why_invalid(city)
    raise NotImplementedError
  end

  # It should also know which country it validates things for.
  def self.country_iso_2
    raise NotImplementedError
  end
end
