# frozen_string_literal: true

require "rails_helper"

def percent_condition
  AdvancementConditions::PercentCondition.new(40)
end

RSpec.describe "WCA Live API" do
  describe "DELETE #quit_competitor" do
    let!(:delegate) { create(:delegate) }
    let(:competition) { create(:competition, event_ids: ["333"], delegates: [delegate]) }
    let(:registrations) { create_list(:registration, 5, :accepted, competition: competition, event_ids: ["333"]) }

    it "Correctly quits a user from a first round" do
      sign_in delegate

      round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: percent_condition)

      registration_1 = registrations.first
      round.open_and_lock_previous(User.first)

      delete api_v1_competition_live_quit_competitor_from_round_path(competition.id, round.wcif_id, registration_1.id)

      expect(response).to be_successful

      result = LiveResult.find_by(round_id: round.id, registration_id: registration_1.id)
      expect(result).to be_nil
    end

    it "Correctly quits a result from the first round and advances the next competitor" do
      sign_in delegate

      round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: percent_condition)
      final = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition)

      5.times do |i|
        create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
      end

      final.open_and_lock_previous(User.first)

      to_advance = round.next_advancing_without(registrations.first.id)

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

      round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: percent_condition)
      registration_1 = registrations.first
      round.open_and_lock_previous(User.first)
      before_hash = Live::DiffHelper.state_hash(round.to_live_state)

      expect do
        delete api_v1_competition_live_quit_competitor_from_round_path(competition.id, round.wcif_id, registration_1.id)
      end.to have_broadcasted_to(Live::Config.broadcast_key(round.wcif_id))
        .from_channel(ApplicationCable::Channel)
        .with(hash_including(deleted: [registration_1.id], before_hash: before_hash))
    end

    it "Broadcasts to first round when quitting second round with advancing set" do
      sign_in delegate

      round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: percent_condition)
      final = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition)

      5.times do |i|
        create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
      end

      final.open_and_lock_previous(User.first)
      before_hash = Live::DiffHelper.state_hash(round.to_live_state)

      to_advance = round.next_advancing_without(registrations.first.id)

      live_request = {
        advancing_ids: to_advance.pluck(:registration_id),
      }

      expect do
        delete api_v1_competition_live_quit_competitor_from_round_path(competition.id, final.wcif_id, registrations.first.id), params: live_request
      end.to have_broadcasted_to(Live::Config.broadcast_key(round.wcif_id))
        .from_channel(ApplicationCable::Channel)
        .with(hash_including(updated: [{ "advancing" => false, "advancing_questionable" => false, "registration_id" => registrations.first.id },
                                       { "advancing" => true, "registration_id" => registrations.third.id }].map { Live::DiffHelper.compress_payload it },
                             before_hash: before_hash))
    end

    it "Broadcasts to second round when quitting second round with advancing set" do
      sign_in delegate

      round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: percent_condition)
      final = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition)

      5.times do |i|
        create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
      end

      final.open_and_lock_previous(User.first)
      before_hash = Live::DiffHelper.state_hash(final.to_live_state)

      to_advance = round.next_advancing_without(registrations.first.id)

      live_request = {
        advancing_ids: to_advance.pluck(:registration_id),
      }

      expect do
        delete api_v1_competition_live_quit_competitor_from_round_path(competition.id, final.wcif_id, registrations.first.id), params: live_request
      end.to have_broadcasted_to(Live::Config.broadcast_key(final.wcif_id))
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
                                         "live_attempts" => [] }].map { Live::DiffHelper.compress_payload it }))
    end
  end
end
