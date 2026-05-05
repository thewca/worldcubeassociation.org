# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API" do
  describe "PUT #clear_round" do
    let!(:delegate) { create(:delegate) }
    let!(:competition) { create(:competition, event_ids: ["333"], delegates: [delegate]) }
    let!(:registrations) { create_list(:registration, 5, :accepted, competition: competition, event_ids: ["333"]) }

    it "Correctly clears the round" do
      sign_in delegate

      round = create(:round, number: 1, event_id: "333", competition: competition)
      round.open_and_lock_previous(User.first)
      expect(round.live_results.length).to eq(5)

      put api_v1_competition_live_live_round_clear_path(competition.id, round.wcif_id)

      expect(response).to be_successful

      round.live_results.reload

      expect(round.live_results.length).to eq(5)
      expect(round.live_results.count(&:complete?)).to eq(0)
      expect(round.competitors_live_results_entered).to eq(0)
    end
  end

  describe "PUT #clear_competitor" do
    let!(:delegate) { create(:delegate) }
    let!(:competition) { create(:competition, event_ids: ["333"], delegates: [delegate]) }
    let!(:registrations) { create_list(:registration, 5, :accepted, competition: competition, event_ids: ["333"]) }

    it "Correctly clears a competitor" do
      sign_in delegate

      round = create(:round, number: 1, event_id: "333", competition: competition)
      round.open_and_lock_previous(User.first)
      expect(round.live_results.length).to eq(5)

      result = round.live_results.find_by!(registration_id: registrations.first)
      attempts = Array.new(5) { |i| { value: 300, attempt_number: i + 1 } }
      UpdateLiveResultJob.perform_now(result, attempts, User.first.id)

      put api_v1_competition_live_clear_competitor_in_round_path(competition.id, round.wcif_id, result.registration_id)

      expect(response).to be_successful

      round.live_results.reload
      result.reload

      expect(round.live_results.length).to eq(5)
      expect(result).not_to be_complete
      expect(result.best).to eq(0)
      expect(result.average).to eq(0)
      expect(result.advancing_questionable).not_to be
    end
  end
end
