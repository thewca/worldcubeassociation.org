# frozen_string_literal: true

require "rails_helper"

def percent_condition
  ResultConditions::Percent.new(scope: "average", value: 40)
end

def ranking_condition
  ResultConditions::Ranking.new(scope: "average", value: 3)
end

RSpec.describe "WCA Live API" do
  describe "DELETE #quit_competitor" do
    let!(:delegate) { create(:delegate) }
    let(:competition) { create(:competition, event_ids: ["333"], delegates: [delegate]) }
    let(:registrations) { create_list(:registration, 5, :accepted, competition: competition, event_ids: ["333"]) }

    it "Correctly quits a user from a first round" do
      sign_in delegate

      round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
      create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: percent_condition, participation_source: round)

      registration_1 = registrations.first
      round.open_and_lock_previous(User.first)

      delete api_v1_competition_live_quit_competitor_from_round_path(competition.id, round.wcif_id, registration_1.id)

      expect(response).to be_successful

      result = LiveResult.find_by(round_id: round.id, registration_id: registration_1.id)
      expect(result).to be_nil
    end

    it "Correctly quits a result from the first round and advances the next competitor" do
      sign_in delegate

      round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
      final = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: percent_condition, participation_source: round)

      5.times do |i|
        create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
      end

      final.open_and_lock_previous(User.first)

      to_advance = final.next_participating_without(registrations.first.id)

      live_request = {
        advancing_ids: to_advance.pluck(:registration_id),
      }

      delete api_v1_competition_live_quit_competitor_from_round_path(competition.id, final.wcif_id, registrations.first.id), params: live_request
      expect(response).to be_successful

      result = LiveResult.find_by(round_id: final.id, registration_id: registrations.first.id)
      expect(result).to be_nil

      result = LiveResult.find_by(round_id: final.id, registration_id: registrations.third.id)
      expect(result).to be_present
    end

    it "Broadcasts to the first round when quitting first round" do
      sign_in delegate

      round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
      create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: percent_condition, participation_source: round)
      registration_1 = registrations.first
      round.open_and_lock_previous(User.first)
      before_hash = Live::DiffHelper.state_hash(round.to_live_state)

      expect do
        delete api_v1_competition_live_quit_competitor_from_round_path(competition.id, round.wcif_id, registration_1.id)
      end.to have_broadcasted_to(Live::Config.broadcast_key(competition.id, round.wcif_id))
        .from_channel(ApplicationCable::Channel)
        .with(hash_including(deleted: [registration_1.id], before_hash: before_hash))
    end

    it "Broadcasts to first round when quitting second round with advancing set" do
      sign_in delegate

      round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
      final = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: percent_condition, participation_source: round)

      5.times do |i|
        create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
      end

      final.open_and_lock_previous(User.first)
      before_hash = Live::DiffHelper.state_hash(round.to_live_state)

      to_advance = final.next_participating_without(registrations.first.id)

      live_request = {
        advancing_ids: to_advance.pluck(:registration_id),
      }

      expect do
        delete api_v1_competition_live_quit_competitor_from_round_path(competition.id, final.wcif_id, registrations.first.id), params: live_request
      end.to have_broadcasted_to(Live::Config.broadcast_key(competition.id, round.wcif_id))
        .from_channel(ApplicationCable::Channel)
        .with(hash_including(updated: [{ "advancing" => false, "advancing_questionable" => false, "registration_id" => registrations.first.id },
                                       { "advancing" => true, "registration_id" => registrations.third.id }].map { Live::DiffHelper.compress_payload it },
                             before_hash: before_hash))
    end

    it "Broadcasts to second round when quitting second round with advancing set" do
      sign_in delegate

      round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition)
      final = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition, participation_condition: percent_condition, participation_source: round)

      5.times do |i|
        create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
      end

      final.open_and_lock_previous(User.first)
      before_hash = Live::DiffHelper.state_hash(final.to_live_state)

      to_advance = final.next_participating_without(registrations.first.id)

      live_request = {
        advancing_ids: to_advance.pluck(:registration_id),
      }

      user = registrations.third.to_live_json

      expect do
        delete api_v1_competition_live_quit_competitor_from_round_path(competition.id, final.wcif_id, registrations.first.id), params: live_request
      end.to have_broadcasted_to(Live::Config.broadcast_key(competition.id, final.wcif_id))
        .from_channel(ApplicationCable::Channel)
        .with(hash_including(deleted: [registrations.first.id],
                             before_hash: before_hash,
                             created: [{ "advancing" => false,
                                         "advancing_questionable" => false,
                                         "average" => 0,
                                         "best" => 0,
                                         "average_record_tag" => nil,
                                         "registration_id" => registrations.third.id,
                                         "single_record_tag" => nil,
                                         "last_attempt_entered_at" => anything,
                                         "live_attempts" => [] }].map { (Live::DiffHelper.compress_payload it).merge({ "user" => user }) }))
    end
  end

  describe "next_participating_without with linked rounds" do
    let(:competition) { create(:competition, event_ids: ["333"]) }
    let(:registrations) { create_list(:registration, 5, :accepted, competition: competition, event_ids: ["333"]) }

    it "excludes all linked-round results for the quitting competitor, not just one" do
      # Linked rounds 1 + 2 feed into a standalone final (round 3).
      linked = create(:linked_round)
      round1 = create(:round, number: 1, total_number_of_rounds: 3, event_id: "333", competition: competition, linked_round: linked)
      round2 = create(:round, number: 2, total_number_of_rounds: 3, event_id: "333", competition: competition, participation_condition: ranking_condition, participation_source: linked, linked_round: linked)
      final = create(:round, number: 3, total_number_of_rounds: 3, event_id: "333", competition: competition, participation_condition: ranking_condition, participation_source: linked)

      # Each competitor has a result in both linked rounds.
      # Round2 is the better attempt for every competitor, so global_pos and
      # advancing=true live on round2 results. Round1 results all have
      # global_pos=NULL and advancing=false.
      #
      # Ranking by best result across both rounds:
      #   registrations[0]: best = round2(100),  round1(150)  → rank 1 (advancing)
      #   registrations[1]: best = round2(200),  round1(9000) → rank 2 (advancing)
      #   registrations[2]: best = round2(300),  round1(9000) → rank 3 (advancing)
      #   registrations[3]: best = round2(400),  round1(9000) → rank 4 (next up)
      #   registrations[4]: best = round2(500),  round1(9000) → rank 5
      5.times do |i|
        create(:live_result, registration: registrations[i], round: round1, average: i.zero? ? 150 : 9000)
        create(:live_result, registration: registrations[i], round: round2, average: (i + 1) * 100)
      end

      final.open_and_lock_previous(User.first)

      next_qualifying = round2.next_participating_without(registrations.first.id)
      expect(next_qualifying.map(&:registration_id)).to contain_exactly(registrations[3].id)
    end
  end
end
