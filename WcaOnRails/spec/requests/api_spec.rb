# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API misc" do
  describe "GET #records" do
    let!(:wr333) { FactoryBot.create :result, eventId: "333", best: 444, countryId: "Australia" }
    let!(:nr333) { FactoryBot.create :result, eventId: "333", best: 555, countryId: "USA" }
    let!(:dnf444) { FactoryBot.create :result, eventId: "444", best: SolveTime::DNF_VALUE, average: SolveTime::DNF_VALUE, countryId: "USA" }

    it "renders current records", clean_db_with_truncation: true do
      # Compute necessary data.
      AuxiliaryDataComputation.compute_concise_results
      Timestamp.create(name: "compute_auxiliary_data_end", date: Time.now)

      get api_v0_records_path
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json['world_records']['333']['single']).to eq 444
      expect(json['continental_records']['_North America']['333']['single']).to eq 555
      expect(json['national_records']['USA']['333']['single']).to eq 555
      expect(json['national_records']['USA'].keys).to eq %w(333)
    end
  end

  describe 'GET #anonymous_age_rankings' do
    it 'returns some age data', clean_db_with_truncation: true do
      # Create 4 fourty year olds.
      4.times do
        fourty_year_old = FactoryBot.create :person, year: 43.years.ago.year
        FactoryBot.create :result, eventId: "333", best: 400, average: 444, person: fourty_year_old
      end

      # Compute necessary data.
      AuxiliaryDataComputation.compute_concise_results
      Timestamp.create(name: "compute_auxiliary_data_end", date: Time.now)

      get api_v0_anonymous_age_rankings_path
      expect(response.status).to eq 200
      json = JSON.parse(response.body)
      expect(json).to eq(
        'single' => [
          {
            "group_number" => 0,
            "group_size" => 4,
            "age_category" => 40,
            "event_id" => "333",
            "group_average" => 400,
          },
        ],
        'average' => [
          {
            "group_number" => 0,
            "group_size" => 4,
            "age_category" => 40,
            "event_id" => "333",
            "group_average" => 444,
          },
        ],
      )
    end
  end
end
