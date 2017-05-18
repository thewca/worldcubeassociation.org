# frozen_string_literal: true

require "rails_helper"

RSpec.describe "competitions" do
  let(:competition) { FactoryGirl.create(:competition, :with_delegate, :visible) }

  describe 'PATCH #update_competition' do
    context "when signed in as admin" do
      sign_in { FactoryGirl.create :admin }

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

      it 'can set championship types for a competition' do
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
      sign_in { FactoryGirl.create :admin }

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
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryGirl.create :user }

      it 'does not allow access' do
        patch update_events_from_wcif_path(competition)
        expect(response).to redirect_to root_path
      end
    end
  end

  describe "GET #post_results" do
    context "when signed in as an admin" do
      sign_in { FactoryGirl.create :admin }
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
