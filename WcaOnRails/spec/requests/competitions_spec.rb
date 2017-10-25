# frozen_string_literal: true

require "rails_helper"

RSpec.describe "competitions" do
  let(:competition) { FactoryBot.create(:competition, :with_delegate, :visible) }

  describe 'PATCH #update_competition' do
    context "when signed in as admin" do
      sign_in { FactoryBot.create :admin }

      it 'can confirm competition' do
        patch competition_path(competition), params: {
          'competition[name]' => competition.name,
          'competition[delegate_ids]' => competition.delegate_ids,
          'commit' => 'Confirm',
        }
        follow_redirect!
        expect(response).to be_success

        expect(competition.reload.isConfirmed?).to eq true
      end

      it 'can set championship types for an unconfirmed competition' do
        expect(competition.isConfirmed).to be false

        patch competition_path(competition), params: {
          competition: {
            championships_attributes: {
              "1" => { championship_type: "world" },
              "0" => { championship_type: "_Europe" },
            },
          },
        }
        follow_redirect!
        expect(response).to be_success
        expect(competition.reload.championships.count).to eq 2
      end

      it 'can set championship types for a confirmed competition' do
        competition.update!(isConfirmed: true)

        patch competition_path(competition), params: {
          competition: {
            championships_attributes: {
              "1" => { championship_type: "world" },
              "0" => { championship_type: "_Europe" },
            },
          },
        }
        follow_redirect!
        expect(response).to be_success
        expect(competition.reload.championships.count).to eq 2
      end
    end

    context "signed in as a delegate" do
      before :each do
        sign_in competition.delegates.first
      end

      it 'can set championship types for an unconfirmed competition' do
        expect(competition.isConfirmed).to be false

        patch competition_path(competition), params: {
          competition: {
            championships_attributes: {
              "1" => { championship_type: "world" },
              "0" => { championship_type: "_Europe" },
            },
          },
        }
        follow_redirect!
        expect(response).to be_success
        expect(competition.reload.championships.count).to eq 2
      end

      it 'cannot set championship types for a confirmed competition' do
        competition.update!(isConfirmed: true)

        patch competition_path(competition), params: {
          competition: {
            championships_attributes: {
              "1" => { championship_type: "world" },
              "0" => { championship_type: "_Europe" },
            },
          },
        }
        follow_redirect!
        expect(response).to be_success
        expect(competition.reload.championships.count).to eq 0
      end
    end
  end

  describe 'POST #update_wcif_events' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        patch update_events_from_wcif_path(competition)
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryBot.create :admin }

      it 'updates the competition events' do
        headers = { "CONTENT_TYPE" => "application/json" }
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
              },
            ],
          },
        ]
        patch update_events_from_wcif_path(competition), params: competition_events.to_json, headers: headers
        expect(response).to be_success
        expect(competition.reload.competition_events.find_by_event_id("333").rounds.length).to eq 1
      end

      it 'does not delete all rounds of an event if something is invalid' do
        FactoryBot.create :round, competition: competition, event_id: "333", number: 1
        FactoryBot.create :round, competition: competition, event_id: "333", number: 2
        competition.reload

        ce = competition.competition_events.find_by_event_id("333")
        expect(ce.rounds.length).to eq 2

        headers = { "CONTENT_TYPE" => "application/json" }
        competition_events = [
          {
            id: "333",
            rounds: [
              {
                id: "333-1",
                format: "invalidformat",
                timeLimit: {
                  centiseconds: 4242,
                  cumulativeRoundIds: [],
                },
                cutoff: nil,
                advancementCondition: nil,
              },
            ],
          },
        ]
        patch update_events_from_wcif_path(competition), params: competition_events.to_json, headers: headers
        expect(response).to have_http_status(400)
        response_json = JSON.parse(response.body)
        expect(response_json["error"]).to eq "The property '#/0/rounds/0/format' value \"invalidformat\" did not match one of the following values: 1, 2, 3, a, m"
        expect(competition.reload.competition_events.find_by_event_id("333").rounds.length).to eq 2
      end
    end

    context 'when signed in as competition delegate' do
      let(:comp_delegate) { competition.delegates.first }

      before :each do
        sign_in comp_delegate
        competition.events = [Event.find("333"), Event.find("222")]
        competition.update!(isConfirmed: true)
      end

      it 'allows adding rounds to an event of confirmed competition' do
        headers = { "CONTENT_TYPE" => "application/json" }
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
              },
            ],
          },
          {
            id: "222",
            rounds: [
              {
                id: "222-1",
                format: "a",
                timeLimit: nil,
                cutoff: nil,
                advancementCondition: nil,
              },
            ],
          },
        ]
        expect(competition.reload.competition_events.find_by_event_id("333").rounds.length).to eq 0
        patch update_events_from_wcif_path(competition), params: competition_events.to_json, headers: headers
        expect(response).to be_success
        expect(competition.reload.competition_events.find_by_event_id("333").rounds.length).to eq 1
      end

      it 'does not allow adding events to a confirmed competition' do
        headers = { "CONTENT_TYPE" => "application/json" }
        competition_events = [
          {
            id: "333",
            rounds: [
              {
                id: "333-1",
                format: "a",
                timeLimit: nil,
                cutoff: nil,
                advancementCondition: nil,
              },
            ],
          },
          {
            id: "222",
            rounds: [
              {
                id: "222-1",
                format: "a",
                timeLimit: nil,
                cutoff: nil,
                advancementCondition: nil,
              },
            ],
          },
          {
            id: "333oh",
            rounds: [
              {
                id: "333oh-1",
                format: "a",
                timeLimit: nil,
                cutoff: nil,
                advancementCondition: nil,
              },
            ],
          },
        ]
        patch update_events_from_wcif_path(competition), params: competition_events.to_json, headers: headers
        expect(response).to have_http_status(422)
        response_json = JSON.parse(response.body)
        expect(response_json["error"]).to eq "Cannot add events to a confirmed competition"
      end

      it 'does not allow removing events from a confirmed competition' do
        headers = { "CONTENT_TYPE" => "application/json" }
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
              },
            ],
          },
          {
            id: "222",
            rounds: nil,
          },
        ]
        patch update_events_from_wcif_path(competition), params: competition_events.to_json, headers: headers
        expect(response).to have_http_status(422)
        response_json = JSON.parse(response.body)
        expect(response_json["error"]).to eq "Cannot remove events from a confirmed competition"
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryBot.create :user }

      it 'does not allow access' do
        patch update_events_from_wcif_path(competition)
        expect(response).to redirect_to root_path
      end
    end
  end

  describe "GET #post_results" do
    context "when signed in as an admin" do
      sign_in { FactoryBot.create :admin }
      it 'can post results for a competition' do
        expect(Post.count).to eq 0

        get competition_post_results_path(competition)

        expect(Post.count).to eq 1

        # Attempt to post results for a competition that already has results posted.
        get competition_post_results_path(competition)

        expect(Post.count).to eq 1
      end
    end
  end
end
