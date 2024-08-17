# frozen_string_literal: true

class Api::V0::GeocodingController < Api::V0::ApiController
  GMAPS_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
  # Enable CSRF protection on our GET action, to restrict usage of our API key to legit queries.
  before_action :raise_if_invalid

  def location_from_query
    query_params = {
      address: params.require(:q),
      key: AppSecrets.GOOGLE_MAPS_API_KEY,
    }
    render json: JSON.parse(RestClient.get(GMAPS_GEOCODING_URL, params: query_params).body)
  end

  def time_zone_from_coordinates
    lat_microdegrees = params.require(:lat).to_i
    lng_microdegrees = params.require(:lng).to_i

    guessed_zones = TZF.tz_names(lat_microdegrees / 1e6, lng_microdegrees / 1e6)

    render json: guessed_zones
  end

  private def raise_if_invalid
    raise ActionController::InvalidAuthenticityToken unless any_authenticity_token_valid?
  end
end
