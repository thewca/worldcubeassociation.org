# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API Competitions" do
  describe "PATCH #update_events_from_wcif" do
    let(:competition) { FactoryBot.create(:competition, :with_delegate, :with_organizer, :visible) }

    describe "website user (cookies based)" do
      let(:competition_events_add_event) {[
        {
          id: "333",
          rounds: [
            {
              id: "333-1",
              format: "a",
              timeLimit: nil,
              cutoff: nil,
              advancementCondition: nil,
              scrambleGroupCount: 1
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
              scrambleGroupCount: 1
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
              scrambleGroupCount: 1
            },
          ],
        },
      ]}

      let(:competition_events_remove_event) {[
        {
          id: "333",
          rounds: [
            {
              id: "333-1",
              format: "a",
              timeLimit: nil,
              cutoff: nil,
              advancementCondition: nil,
              scrambleGroupCount: 1
            },
          ],
        },
      ]}

      context "when not signed in" do
        sign_out

        it "does not allow access" do
          patch api_v0_competition_update_events_from_wcif_path(competition)
          expect(response).to have_http_status(401)
          response_json = JSON.parse(response.body)
          expect(response_json["error"]).to eq "Not logged in"
        end
      end

      context "when signed in as a board member" do
        sign_in { FactoryBot.create :board_member }

        #Test might be redundant?
        it "updates the competition events" do
          headers = { "CONTENT_TYPE" => "application/json" }
          patch api_v0_competition_update_events_from_wcif_path(competition), params: competition_events_remove_event.to_json, headers: headers
          expect(response).to be_success
          expect(competition.reload.competition_events.find_by_event_id("333").rounds.length).to eq 1
        end

        it "does not delete all rounds of an event if something is invalid" do
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
          patch api_v0_competition_update_events_from_wcif_path(competition), params: competition_events.to_json, headers: headers
          expect(response).to have_http_status(400)
          response_json = JSON.parse(response.body)
          expect(response_json["error"]).to eq "The property '#/0/rounds/0/format' value \"invalidformat\" did not match one of the following values: 1, 2, 3, a, m"
          expect(competition.reload.competition_events.find_by_event_id("333").rounds.length).to eq 2
        end

        context "confirmed competition" do
          before :each do
            competition.events = [Event.find("333"), Event.find("222")]
            competition.update!(isConfirmed: true)
          end

          it "can add events" do
            headers = { "CONTENT_TYPE" => "application/json" }
            patch api_v0_competition_update_events_from_wcif_path(competition), params: competition_events_add_event.to_json, headers: headers
            expect(response).to have_http_status(200)
            response_json = JSON.parse(response.body)
            competition.reload
            expect(competition.events.map(&:id)).to match_array %w(222 333 333oh)
          end

          it "can remove events" do
            headers = { "CONTENT_TYPE" => "application/json" }
            patch api_v0_competition_update_events_from_wcif_path(competition), params: competition_events_remove_event.to_json, headers: headers
            expect(response).to have_http_status(200)
            response_json = JSON.parse(response.body)
            competition.reload
            expect(competition.events.map(&:id)).to match_array %w(333)
          end
        end
      end

      context "when signed in as competition delegate" do
        let(:comp_delegate) { competition.delegates.first }

        before :each do
          sign_in comp_delegate
          competition.events = [Event.find("333"), Event.find("222")]
        end

        context "confirmed competition" do
          before :each do
            competition.update!(isConfirmed: true)
          end

          it "allows adding rounds to an event" do
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
                    scrambleGroupCount: 1,
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
                    scrambleGroupCount: 1,
                  },
                ],
              },
            ]
            expect(competition.reload.competition_events.find_by_event_id("333").rounds.length).to eq 0
            patch api_v0_competition_update_events_from_wcif_path(competition), params: competition_events.to_json, headers: headers
            expect(response).to be_success
            expect(competition.reload.competition_events.find_by_event_id("333").rounds.length).to eq 1
          end

          it "does not allow adding events" do
            headers = { "CONTENT_TYPE" => "application/json" }
            patch api_v0_competition_update_events_from_wcif_path(competition), params: competition_events_add_event.to_json, headers: headers
            expect(response).to have_http_status(422)
            response_json = JSON.parse(response.body)
            expect(response_json["error"]).to eq "Cannot add events to a confirmed competition"
          end

          it "does not allow removing events" do
            headers = { "CONTENT_TYPE" => "application/json" }
            patch api_v0_competition_update_events_from_wcif_path(competition), params: competition_events_remove_event.to_json, headers: headers
            expect(response).to have_http_status(422)
            response_json = JSON.parse(response.body)
            expect(response_json["error"]).to eq "Cannot remove events from a confirmed competition"
          end
        end

        context "unconfirmed competition" do
          it "allows adding events" do
            headers = { "CONTENT_TYPE" => "application/json" }
            patch api_v0_competition_update_events_from_wcif_path(competition), params: competition_events_add_event.to_json, headers: headers
            expect(response).to have_http_status(200)
            response_json = JSON.parse(response.body)
            competition.reload
            expect(competition.events.map(&:id)).to match_array %w(222 333 333oh)
          end

          it "allows removing events" do
            headers = { "CONTENT_TYPE" => "application/json" }
            patch api_v0_competition_update_events_from_wcif_path(competition), params: competition_events_remove_event.to_json, headers: headers
            expect(response).to have_http_status(200)
            response_json = JSON.parse(response.body)
            competition.reload
            expect(competition.events.map(&:id)).to match_array %w(333)
          end
        end
      end

      context "when signed in as a regular user" do
        sign_in { FactoryBot.create :user }

        it "does not allow access" do
          patch api_v0_competition_update_events_from_wcif_path(competition)
          expect(response).to have_http_status(403)
          response_json = JSON.parse(response.body)
          expect(response_json["error"]).to eq "Not authorized to manage competition"
        end
      end
    end

    describe "OAuth user" do
      context "as a competition manager" do
        let(:scopes) { Doorkeeper::OAuth::Scopes.new }

        before :each do
          scopes.add "manage_competitions"
          api_sign_in_as(competition.organizers.first, scopes: scopes)
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
          patch api_v0_competition_update_events_from_wcif_path(competition), params: competition_events.to_json, headers: { "CONTENT_TYPE" => "application/json" }
          expect(response).to be_success
          rounds = competition.reload.competition_events.find_by_event_id("333").rounds
          expect(rounds.length).to eq 1
          expect(rounds.first.scramble_group_count).to eq 2
        end
      end

      context "as a normal user" do
        let(:user) { FactoryBot.create :user }
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
          patch api_v0_competition_update_events_from_wcif_path(competition), params: competition_events.to_json, headers: { "CONTENT_TYPE" => "application/json" }
          expect(response.status).to eq 403
          expect(competition.reload.competition_events.find_by_event_id("333").rounds.length).to eq 0
        end
      end
    end

    describe "CSRF" do
      # CSRF protection is always disabled for tests, enable it for this these requests.
      around(:each) do |example|
        ActionController::Base.allow_forgery_protection = true
        example.run
        ActionController::Base.allow_forgery_protection = false
      end

      context "cookies based user" do
        sign_in { FactoryBot.create :user }

        it "prevents from CSRF attacks" do
          headers = { "CONTENT_TYPE" => "application/json", "ACCESS_TOKEN" => "INVALID" }
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
                  scrambleGroupCount: 1,
                },
              ],
            },
          ]
          expect {
            patch api_v0_competition_update_events_from_wcif_path(competition), params: competition_events.to_json, headers: headers
          }.to raise_exception ActionController::InvalidAuthenticityToken
        end
      end

      context "OAuth user" do
        let(:scopes) { Doorkeeper::OAuth::Scopes.new }

        before :each do
          scopes.add "manage_competitions"
          api_sign_in_as(competition.organizers.first, scopes: scopes)
        end

        it "does not use CSRF protection as we use oauth token" do
          headers = { "CONTENT_TYPE" => "application/json", "ACCESS_TOKEN" => nil }
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
                  scrambleGroupCount: 1,
                },
              ],
            },
          ]
          patch api_v0_competition_update_events_from_wcif_path(competition), params: competition_events.to_json, headers: headers
          expect(response).to be_success
        end
      end
    end
  end
end