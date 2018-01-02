# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API Competitions" do
  describe "POST #update_events_from_wcif" do
    context "as a competition manager" do
      let(:user) { FactoryBot.create :user }
      let(:competition) { FactoryBot.create :competition, organizers: [user], event_ids: %w(333) }
      let(:scopes) { Doorkeeper::OAuth::Scopes.new }

      before :each do
        scopes.add "manage_competitions"
        api_sign_in_as(user, scopes: scopes)
      end

      it "can update events" do
        competition_events = [
          {
            id: "333",
            rounds: [
              {
                id: "333-1",
                format: "a",
                timeLimit: {
                  centiseconds: 4242,
                  cumulativeRoundIds: [],
                },
                cutoff: nil,
                advancementCondition: nil,
                scrambleGroupCount: 2,
              },
            ],
          },
        ]
        post api_v0_competition_update_events_from_wcif_path(competition), params: competition_events.to_json, headers: { "CONTENT_TYPE" => "application/json" }
        expect(response).to be_success
        rounds = competition.reload.competition_events.find_by_event_id("333").rounds
        expect(rounds.length).to eq 1
        expect(rounds.first.scramble_group_count).to eq 2
      end
    end

    context "as a normal user" do
      let(:user) { FactoryBot.create :user }
      let(:competition) { FactoryBot.create :competition, event_ids: %w(333) }
      let(:scopes) { Doorkeeper::OAuth::Scopes.new }

      before :each do
        scopes.add "manage_competitions"
        api_sign_in_as(user, scopes: scopes)
      end

      it "can update events" do
        competition_events = [
          {
            id: "333",
            rounds: [
              {
                id: "333-1",
                format: "a",
                timeLimit: {
                  centiseconds: 4242,
                  cumulativeRoundIds: [],
                },
                cutoff: nil,
                advancementCondition: nil,
                scrambleGroupCount: 2,
              },
            ],
          },
        ]
        post api_v0_competition_update_events_from_wcif_path(competition), params: competition_events.to_json, headers: { "CONTENT_TYPE" => "application/json" }
        expect(response.status).to eq 404
        expect(competition.reload.competition_events.find_by_event_id("333").rounds.length).to eq 0
      end
    end
  end
end
