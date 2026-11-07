# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API v1 Geocoding" do
  let(:geocoding_response) do
    {
      status: "OK",
      results: [
        {
          formatted_address: "Berlin, Germany",
          geometry: { location: { lat: 52.52, lng: 13.405 } },
        },
      ],
    }
  end

  before do
    stub_request(:get, Api::V0::GeocodingController::GMAPS_GEOCODING_URL)
      .with(query: hash_including(address: "Berlin"))
      .to_return(status: 200, body: geocoding_response.to_json, headers: { 'Content-Type' => 'application/json' })
  end

  describe "GET #search" do
    it "requires the user to be logged in" do
      get api_v1_geocoding_search_path, params: { q: "Berlin" }

      expect(response).to have_http_status(:unauthorized)
    end

    context "when logged in" do
      before { api_sign_in_as(create(:user)) }

      it "returns the matching locations" do
        get api_v1_geocoding_search_path, params: { q: "Berlin" }

        expect(response).to be_successful
        expect(response.parsed_body).to eq [
          { "formatted_address" => "Berlin, Germany", "latitude" => 52.52, "longitude" => 13.405 },
        ]
      end

      it "rejects searches beyond the rate limit" do
        Api::V1::GeocodingController::SEARCHES_PER_MINUTE.times do
          get api_v1_geocoding_search_path, params: { q: "Berlin" }
          expect(response).to be_successful
        end

        get api_v1_geocoding_search_path, params: { q: "Berlin" }

        expect(response).to have_http_status(:too_many_requests)
        expect(response.parsed_body).to include("error")
      end
    end
  end
end
