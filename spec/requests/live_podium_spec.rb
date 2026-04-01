# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API" do
  describe "GET #podiums" do
    let!(:delegate) { create(:delegate) }
    let(:competition) { create(:competition, event_ids: ["333"], delegates: [delegate]) }
    let(:registrations) { create_list(:registration, 5, :accepted, competition: competition, event_ids: ["333"]) }

    it "Correctly gets the podium of a normal round" do
      round = create(:round, number: 1, total_number_of_rounds: 1, event_id: "333", competition: competition)

      5.times do |i|
        create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
      end

      get api_v1_competition_live_live_podiums_path(competition.id)

      expect(response).to be_successful

      response_json = response.parsed_body

      expect(response_json.first["results"].pluck(:registration_id)).to eq([registrations.first.id, registrations.second.id, registrations.third.id])
    end

    it "Correctly gets the podium of a dual round" do
      l = create(:linked_round)
      r1 = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, linked_round_id: l.id)
      r2 = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, linked_round_id: l.id)
      r1.linked_round.reload
      r2.linked_round.reload

      5.times do |i|
        create(:live_result, registration: registrations[i], round: r1, average: (i + 1) * 100)
        create(:live_result, registration: registrations[i], round: r2, average: ((i + 1) * 100) - 1)
      end

      get api_v1_competition_live_live_podiums_path(competition.id)

      expect(response).to be_successful

      response_json = response.parsed_body

      expect(response_json.length).to eq(1)

      expect(response_json.first["results"].pluck(:registration_id)).to eq([registrations.first.id, registrations.second.id, registrations.third.id])
    end
  end
end
