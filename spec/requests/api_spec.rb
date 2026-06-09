# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API misc" do
  describe "GET #records" do
    let!(:wr333) { create(:result, event_id: "333", best: 444, country_id: "Australia") }
    let!(:nr333) { create(:result, event_id: "333", best: 555, country_id: "USA") }
    let!(:dnf444) { create(:result, event_id: "444", best: SolveTime::DNF_VALUE, average: SolveTime::DNF_VALUE, country_id: "USA") }

    it "renders current records", :clean_db_with_truncation do
      # Compute necessary data.
      AuxiliaryDataComputation.compute_everything

      get api_v0_records_path
      expect(response).to have_http_status :ok
      json = response.parsed_body
      expect(json['world_records']['333']['single']).to eq 444
      expect(json['continental_records']['_North America']['333']['single']).to eq 555
      expect(json['national_records']['USA']['333']['single']).to eq 555
      expect(json['national_records']['USA'].keys).to eq %w[333]
    end
  end
end
