# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API" do
  describe "GET #podiums" do
    let(:competition) { create(:competition, :with_delegate, event_ids: ["333"]) }
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
      r1 = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
      r2 = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition)
      create(:linked_round, rounds: [r1, r2])

      5.times do |i|
        create(:live_result, registration: registrations[i], round: r1, average: (i + 1) * 100)
        create(:live_result, registration: registrations[i], round: r2, average: ((i + 1) * 100) - 1)
      end

      get api_v1_competition_live_live_podiums_path(competition.id)

      expect(response).to be_successful

      response_json = response.parsed_body

      expect(response_json.length).to eq(1)

      expect(response_json.first["results"].pluck(:registration_id)).to eq(registrations.take(3).pluck(:id))
    end

    it "Correctly gets the podium when results are mixed across rounds" do
      r1 = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
      r2 = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition)
      create(:linked_round, rounds: [r1, r2])

      # registrations[0]: best in r2 (500 vs 600) -> best: 500
      # registrations[1]: best in r1 (200 vs 900) -> best: 200
      # registrations[2]: best in r2 (150 vs 800) -> best: 150  <- 1st
      # registrations[3]: best in r1 (300 vs 700) -> best: 300
      # registrations[4]: best in r2 (250 vs 400) -> best: 250
      create(:live_result, registration: registrations[0], round: r1, average: 600)
      create(:live_result, registration: registrations[0], round: r2, average: 500)

      create(:live_result, registration: registrations[1], round: r1, average: 200)
      create(:live_result, registration: registrations[1], round: r2, average: 900)

      create(:live_result, registration: registrations[2], round: r1, average: 800)
      create(:live_result, registration: registrations[2], round: r2, average: 150)

      create(:live_result, registration: registrations[3], round: r1, average: 300)
      create(:live_result, registration: registrations[3], round: r2, average: 700)

      create(:live_result, registration: registrations[4], round: r1, average: 400)
      create(:live_result, registration: registrations[4], round: r2, average: 250)

      get api_v1_competition_live_live_podiums_path(competition.id)

      expect(response).to be_successful

      response_json = response.parsed_body
      expect(response_json.length).to eq(1)

      # Expected order: [2](150), [1](200), [4](250)
      expect(response_json.first["results"].pluck(:registration_id)).to eq([
                                                                             registrations[2].id,
                                                                             registrations[1].id,
                                                                             registrations[4].id,
                                                                           ])
    end

    it "Correctly gets the podium when some competitors are missing results in one round" do
      r1 = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
      r2 = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition)
      create(:linked_round, rounds: [r1, r2])

      # registrations[0]: only r1 result  -> best: 300
      # registrations[1]: only r2 result  -> best: 100  <- 1st
      # registrations[2]: both rounds     -> best: 200  <- 2nd
      # registrations[3]: both rounds     -> best: 400  <- 3rd
      # registrations[4]: only r1 result  -> best: 500
      create(:live_result, registration: registrations[0], round: r1, average: 300)
      create(:live_result, registration: registrations[0], round: r2, average: 0)

      create(:live_result, registration: registrations[1], round: r2, average: 100)
      create(:live_result, registration: registrations[1], round: r1, average: 0)

      create(:live_result, registration: registrations[2], round: r1, average: 200)
      create(:live_result, registration: registrations[2], round: r2, average: 999)

      create(:live_result, registration: registrations[3], round: r1, average: 999)
      create(:live_result, registration: registrations[3], round: r2, average: 400)

      create(:live_result, registration: registrations[4], round: r1, average: 500)
      create(:live_result, registration: registrations[4], round: r2, average: 0)

      get api_v1_competition_live_live_podiums_path(competition.id)

      expect(response).to be_successful

      response_json = response.parsed_body
      expect(response_json.length).to eq(1)

      # Expected order: [1](100), [2](200), [0](300)
      expect(response_json.first["results"].pluck(:registration_id)).to eq([
                                                                             registrations[1].id,
                                                                             registrations[2].id,
                                                                             registrations[0].id,
                                                                           ])
    end

    it "Correctly gets the podium when competitors are tied on average, broken by best single" do
      r1 = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
      r2 = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition)
      create(:linked_round, rounds: [r1, r2])

      # registrations[0] and [1] tie on average (300), broken by best single
      # registrations[0]: average 300, best 280  <- 1st (better single)
      # registrations[1]: average 300, best 290  <- 2nd (worse single)
      # registrations[2]: average 400, best 100  <- 3rd (best single doesn't overcome average)
      create(:live_result, registration: registrations[0], round: r1, average: 300, best: 280)
      create(:live_result, registration: registrations[1], round: r1, average: 300, best: 290)
      create(:live_result, registration: registrations[2], round: r1, average: 400, best: 100)
      create(:live_result, registration: registrations[3], round: r1, average: 500, best: 280)
      create(:live_result, registration: registrations[4], round: r1, average: 600, best: 290)
      create(:live_result, registration: registrations[0], round: r2, average: 600, best: 280)
      create(:live_result, registration: registrations[1], round: r2, average: 700, best: 290)
      create(:live_result, registration: registrations[2], round: r2, average: 800, best: 100)
      create(:live_result, registration: registrations[3], round: r2, average: 900, best: 280)
      create(:live_result, registration: registrations[4], round: r2, average: 1000, best: 290)

      get api_v1_competition_live_live_podiums_path(competition.id)

      expect(response).to be_successful

      response_json = response.parsed_body
      expect(response_json.length).to eq(1)

      expect(response_json.first["results"].pluck(:registration_id)).to eq([
                                                                             registrations[0].id,
                                                                             registrations[1].id,
                                                                             registrations[2].id,
                                                                           ])
    end

    it "Doesn't return the podium when there are missing results" do
      r1 = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
      r2 = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition)
      create(:linked_round, rounds: [r1, r2])

      # registrations[0] and [1] tie on average (300), broken by best single
      # registrations[0]: average 300, best 280  <- 1st (better single)
      # registrations[1]: average 300, best 290  <- 2nd (worse single)
      # registrations[2]: average 400, best 100  <- 3rd (best single doesn't overcome average)
      create(:live_result, registration: registrations[0], round: r1, average: 300, best: 280)
      create(:live_result, registration: registrations[1], round: r1, average: 300, best: 290)
      create(:live_result, registration: registrations[2], round: r1, average: 400, best: 100)

      get api_v1_competition_live_live_podiums_path(competition.id)

      expect(response).to be_successful

      response_json = response.parsed_body
      expect(response_json.length).to eq(1)

      expect(response_json.first["results"].pluck(:registration_id)).to eq([])
    end

    it "Correctly marks a shared podium position when average and best are exactly tied" do
      r1 = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
      r2 = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition)
      create(:linked_round, rounds: [r1, r2])

      # registrations[0] and [1] are completely tied (average and best) -> both share 1st
      # registrations[2] comes 3rd
      create(:live_result, registration: registrations[0], round: r1, average: 300, best: 280)
      create(:live_result, registration: registrations[1], round: r1, average: 300, best: 280)
      create(:live_result, registration: registrations[2], round: r1, average: 400, best: 350)
      create(:live_result, registration: registrations[3], round: r1, average: 500, best: 280)
      create(:live_result, registration: registrations[4], round: r1, average: 600, best: 290)
      create(:live_result, registration: registrations[0], round: r2, average: 600, best: 280)
      create(:live_result, registration: registrations[1], round: r2, average: 700, best: 290)
      create(:live_result, registration: registrations[2], round: r2, average: 800, best: 100)
      create(:live_result, registration: registrations[3], round: r2, average: 900, best: 280)
      create(:live_result, registration: registrations[4], round: r2, average: 1000, best: 290)

      get api_v1_competition_live_live_podiums_path(competition.id)

      expect(response).to be_successful

      response_json = response.parsed_body
      expect(response_json.length).to eq(1)

      podium_results = response_json.first["results"]
      tied_results = podium_results.select { |r| [registrations[0].id, registrations[1].id].include?(r[:registration_id]) }
      third_result = podium_results.find { |r| r[:registration_id] == registrations[2].id }

      expect(tied_results).to all(include("global_pos" => 1))
      expect(third_result).to include("global_pos" => 3)
    end
  end
end
