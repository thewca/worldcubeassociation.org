# frozen_string_literal: true

require "rails_helper"

def attempt_result_condition
  AdvancementConditions::AttemptResultCondition.new(300)
end

RSpec.describe "WCA Live API" do
  describe "DELETE #quit_competitor" do
    let!(:delegate) { create(:delegate) }
    let(:competition) { create(:competition, event_ids: ["333"], delegates: [delegate]) }
    let(:registrations) { create_list(:registration, 5, :accepted, competition: competition, event_ids: ["333"]) }

    it "Correctly quits a user from a first round" do
      sign_in delegate

      round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: attempt_result_condition)

      registration_1 = registrations.first
      round.open_and_lock_previous(User.first)

      delete api_v1_competition_live_quit_competitor_from_round_path(competition.id, round.wcif_id, registration_1.id)

      expect(response).to be_successful

      result = LiveResult.find_by(round_id: round.id, registration_id: registration_1.id)
      expect(result).to be_nil
    end

    it "Broadcasts to the first round when quitting first round" do
      sign_in delegate

      round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: attempt_result_condition)
      registration_1 = registrations.first
      round.open_and_lock_previous(User.first)

      expect do
        delete api_v1_competition_live_quit_competitor_from_round_path(competition.id, round.wcif_id, registration_1.id)
      end.to have_broadcasted_to(Live::Config.broadcast_key(round.wcif_id)).from_channel(ApplicationCable::Channel)
    end

    it "Broadcasts to first round when quitting second round with advancing set" do
      sign_in delegate

      round = create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", competition: competition, advancement_condition: attempt_result_condition)
      final = create(:round, number: 2, total_number_of_rounds: 2, event_id: "333", competition: competition)

      5.times do |i|
        create(:live_result, registration: registrations[i], round: round, average: (i + 1) * 100)
      end

      final.open_and_lock_previous(User.first)

      live_request = {
        advance_next: true,
      }

      expect do
        delete api_v1_competition_live_quit_competitor_from_round_path(competition.id, final.wcif_id, registrations.first.id), params: live_request
      end.to have_broadcasted_to(Live::Config.broadcast_key(round.wcif_id)).from_channel(ApplicationCable::Channel)
    end
  end
end
