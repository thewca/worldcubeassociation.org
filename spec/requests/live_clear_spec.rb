# frozen_string_literal: true

require "rails_helper"

RSpec.describe "WCA Live API" do
  describe "PUT #clear_round" do
    let!(:delegate) { create(:delegate) }
    let!(:competition) { create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate]) }
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
      expect(round.completed_competitors).to eq(0)
    end
  end

  describe "PUT #clear_competitor" do
    let!(:delegate) { create(:delegate) }
    let!(:competition) { create(:competition, scoretaking_software: :internal, event_ids: ["333"], delegates: [delegate]) }
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

    it "keeps a locked round locked" do
      sign_in delegate

      round = create(:round, number: 1, event_id: "333", competition: competition, total_number_of_rounds: 2)
      next_round = create(:round, number: 2, event_id: "333", competition: competition, total_number_of_rounds: 2,
                                  participation_source: round, participation_condition: ResultConditions::Ranking.new(scope: "average", value: 3))

      round.open_and_lock_previous(delegate)
      round.live_results.each do |result|
        attempts = Array.new(5) { |i| { value: 300, attempt_number: i + 1 } }
        UpdateLiveResultJob.perform_now(result, attempts, delegate.id)
      end
      round.live_results.update_all(advancing: true)
      next_round.open_and_lock_previous(delegate)
      expect(round.reload).to be_locked

      result = round.live_results.find_by!(registration_id: registrations.first.id)
      expect(result).to be_advancing

      put api_v1_competition_live_clear_competitor_in_round_path(competition.id, round.wcif_id, registrations.first.id)

      expect(response).to be_successful
      expect(round.reload.lifecycle_state).to eq(Round::STATE_LOCKED)
      expect(result.reload).to be_advancing
    end
  end
end
