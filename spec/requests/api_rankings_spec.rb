# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API Rankings" do
  describe "GET /api/v0/results/rankings/:event_id/:type" do
    it "returns single rankings" do
      get "/api/v0/results/rankings/333/single"

      expect(response).to be_successful
      expect(response.parsed_body).to include("rankings")
    end

    it "returns average rankings" do
      get "/api/v0/results/rankings/333/average"

      expect(response).to be_successful
      expect(response.parsed_body).to include("rankings")
    end

    it "rejects an unknown type" do
      get "/api/v0/results/rankings/333/best"

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["error"]).to eq "Unknown ranking type, must be one of: single, average"
    end

    it "does not run a query containing SQL from the type" do
      expect(DbHelper).not_to receive(:execute_cached_query)

      get "/api/v0/results/rankings/333/#{ERB::Util.url_encode('single_results UNION SELECT SLEEP(5) -- ')}"

      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
