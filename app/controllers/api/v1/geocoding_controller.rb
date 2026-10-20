# frozen_string_literal: true

class Api::V1::GeocodingController < Api::V1::ApiController
  SEARCHES_PER_MINUTE = 5

  rate_limit to: SEARCHES_PER_MINUTE,
             within: 1.minute,
             name: "geocoding_search",
             by: -> { authenticated_user.id },
             with: -> { render_error(:too_many_requests, I18n.t("competitions.index.location_search_failed")) }

  def search
    query_params = {
      address: params.require(:q),
      key: AppSecrets.GOOGLE_MAPS_API_KEY,
    }
    geocoding_response = JSON.parse(RestClient.get(Api::V0::GeocodingController::GMAPS_GEOCODING_URL, params: query_params).body)

    locations = geocoding_response["results"].map do |result|
      {
        formatted_address: result["formatted_address"],
        latitude: result.dig("geometry", "location", "lat"),
        longitude: result.dig("geometry", "location", "lng"),
      }
    end

    render json: locations
  end
end
