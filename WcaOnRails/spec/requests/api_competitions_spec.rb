# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API Competitions" do
  let(:headers) { { "CONTENT_TYPE" => "application/json" } }

  describe "PATCH #update_events_from_wcif" do
    let(:competition) { FactoryBot.create(:competition, :with_delegate, :with_organizer, :visible) }

    describe "website user (cookies based)" do
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
        sign_in { FactoryBot.create :user, :board_member }

        it "updates the competition events of an unconfirmed competition" do
          patch api_v0_competition_update_events_from_wcif_path(competition), params: create_wcif_events(%w(333)).to_json, headers: headers
          expect(response).to be_success
          expect(competition.reload.competition_events.find_by_event_id("333").rounds.length).to eq 1
        end

        it "does not delete all rounds of an event if something is invalid" do
          FactoryBot.create :round, competition: competition, event_id: "333", number: 1
          FactoryBot.create :round, competition: competition, event_id: "333", number: 2
          competition.reload

          ce = competition.competition_events.find_by_event_id("333")
          expect(ce.rounds.length).to eq 2
          competition_events = create_wcif_events(%w(333))
          competition_events[0][:rounds][0][:format] = "invalidformat"
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
            patch api_v0_competition_update_events_from_wcif_path(competition), params: create_wcif_events(%w(333 333oh 222)).to_json, headers: headers
            expect(response).to have_http_status(200)
            competition.reload
            expect(competition.events.map(&:id)).to match_array %w(222 333 333oh)
          end

          it "can remove events" do
            patch api_v0_competition_update_events_from_wcif_path(competition), params: create_wcif_events(%w(333)).to_json, headers: headers
            expect(response).to have_http_status(200)
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
            competition_events = create_wcif_events(%w(222 333))
            expect(competition.reload.competition_events.find_by_event_id("333").rounds.length).to eq 0
            patch api_v0_competition_update_events_from_wcif_path(competition), params: competition_events.to_json, headers: headers
            expect(response).to be_success
            expect(competition.reload.competition_events.find_by_event_id("333").rounds.length).to eq 1
          end

          it "does not allow adding events" do
            patch api_v0_competition_update_events_from_wcif_path(competition), params: create_wcif_events(%w(333 333oh 222)).to_json, headers: headers
            expect(response).to have_http_status(422)
            response_json = JSON.parse(response.body)
            expect(response_json["error"]).to eq "Cannot add events to a confirmed competition"
          end

          it "does not allow removing events" do
            patch api_v0_competition_update_events_from_wcif_path(competition), params: create_wcif_events(%w(333)).to_json, headers: headers
            expect(response).to have_http_status(422)
            response_json = JSON.parse(response.body)
            expect(response_json["error"]).to eq "Cannot remove events from a confirmed competition"
          end
        end

        context "unconfirmed competition" do
          it "allows adding events" do
            patch api_v0_competition_update_events_from_wcif_path(competition), params: create_wcif_events(%w(333 333oh 222)).to_json, headers: headers
            expect(response).to have_http_status(200)
            competition.reload
            expect(competition.events.map(&:id)).to match_array %w(222 333 333oh)
          end

          it "allows removing events" do
            patch api_v0_competition_update_events_from_wcif_path(competition), params: create_wcif_events(%w(333)).to_json, headers: headers
            expect(response).to have_http_status(200)
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
          competition_events = create_wcif_events(%w(333))
          round333_first = competition_events[0][:rounds][0]
          round333_first[:scrambleSetCount] = 2
          round333_first[:roundResults] = [
            {
              personId: 1,
              ranking: 10,
              attempts: [{ result: 456 }, { result: 745 }, { result: 657 }, { result: 465 }, { result: 835 }],
            },
          ]
          patch api_v0_competition_update_events_from_wcif_path(competition), params: competition_events.to_json, headers: { "CONTENT_TYPE" => "application/json" }
          expect(response).to be_success
          rounds = competition.reload.competition_events.find_by_event_id("333").rounds
          expect(rounds.length).to eq 1
          expect(rounds.first.scramble_set_count).to eq 2
          expect(rounds.first.round_results.length).to eq 1
          expect(rounds.first.round_results.first.attempts.map(&:result)).to eq [456, 745, 657, 465, 835]
        end
      end

      context "as a normal user" do
        let(:user) { FactoryBot.create :user }
        let(:scopes) { Doorkeeper::OAuth::Scopes.new }

        before :each do
          scopes.add "manage_competitions"
          api_sign_in_as(user, scopes: scopes)
        end

        it "can't update events" do
          competition_events = create_wcif_events(%w(333))
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
          headers["ACCESS_TOKEN"] = "INVALID"
          competition_events = create_wcif_events(%w(333))
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
          headers["ACCESS_TOKEN"] = nil
          competition_events = create_wcif_events(%w(333))
          patch api_v0_competition_update_events_from_wcif_path(competition), params: competition_events.to_json, headers: headers
          expect(response).to be_success
        end
      end
    end
  end

  describe "PATCH #update_persons_from_wcif" do
    let!(:competition) { FactoryBot.create(:competition, :with_delegate, :with_organizer, :visible, :registration_open) }
    let!(:registration) { FactoryBot.create(:registration, competition: competition) }
    let!(:organizer_registration) { FactoryBot.create(:registration, competition: competition, user: competition.organizers.first) }

    context "when not signed in" do
      it "does not allow access" do
        patch api_v0_competition_update_persons_from_wcif_path(competition)
        expect(response).to have_http_status(401)
        response_json = JSON.parse(response.body)
        expect(response_json["error"]).to eq "Not logged in"
      end
    end

    context "when signed in as a competition manager" do
      before { sign_in competition.organizers.first }

      it "can change roles for a person" do
        persons = [{ wcaUserId: registration.user.id, roles: ["scrambler", "dataentry"] }]
        patch api_v0_competition_update_persons_from_wcif_path(competition), params: persons.to_json, headers: headers
        expect(registration.reload.roles).to eq ["scrambler", "dataentry"]
      end

      it "cannot override organizer role" do
        persons = [{ wcaUserId: organizer_registration.user.id, roles: ["scrambler"] }]
        patch api_v0_competition_update_persons_from_wcif_path(competition), params: persons.to_json, headers: headers
        expect(organizer_registration.reload.roles).to eq ["scrambler"]
        person_wcif = competition.reload.to_wcif["persons"].find { |person| person["wcaUserId"] == organizer_registration.user.id }
        expect(person_wcif["roles"]).to match_array ["scrambler", "organizer"]
      end

      it "cannot change person immutable data" do
        persons = [{
          wcaUserId: registration.user.id,
          name: "New Name",
          wcaId: "2018NEWW01",
          registrantId: 123,
          countryIso2: "NEW",
          gender: "f",
          email: "new@email.com",
          avatar: nil,
          personalBests: [],
        }]
        expect {
          patch api_v0_competition_update_persons_from_wcif_path(competition), params: persons.to_json, headers: headers
        }.to_not change { competition.reload.to_wcif["persons"] }
      end
    end
  end

  describe "PATCH #update_schedule_from_wcif" do
    let!(:competition) { FactoryBot.create(:competition, :with_delegate, :with_organizer, :visible, :registration_open, with_schedule: true) }

    context "when not signed in" do
      it "does not allow access" do
        patch api_v0_competition_update_schedule_from_wcif_path(competition)
        expect(response).to have_http_status(401)
        response_json = JSON.parse(response.body)
        expect(response_json["error"]).to eq "Not logged in"
      end
    end

    context "when signed in as not a competition manager" do
      before(:each) { sign_in FactoryBot.create(:user) }
      it "does not allow access" do
        patch api_v0_competition_update_schedule_from_wcif_path(competition)
        expect(response).to have_http_status(403)
        response_json = JSON.parse(response.body)
        expect(response_json["error"]).to eq "Not authorized to manage competition"
      end
    end

    context "when signed in as a competition manager" do
      before { sign_in competition.organizers.first }

      let!(:schedule) { competition.to_wcif["schedule"] }

      it "can set venues, rooms and activities" do
        expect {
          # Destroy everything
          competition.competition_venues.destroy_all
          # Reconstruct everything from the saved WCIF
          patch api_v0_competition_update_schedule_from_wcif_path(competition), params: schedule.to_json, headers: headers
        }.to_not change { competition.reload.to_wcif["schedule"] }
      end

      it "can update venues and rooms" do
        venue = competition.competition_venues.find_by(wcif_id: 2)
        room = venue.venue_rooms.find_by(wcif_id: 2)
        new_venue_attributes = {
          # keep the WCIF id to update the venue
          id: 2,
          name: "new name",
          latitudeMicrodegrees: 0,
          longitudeMicrodegrees: 0,
          timezone: "Europe/Paris",
          rooms: [{
            id: 2,
            name: "my new third room",
            activities: [],
          }],
        }
        schedule["venues"][1] = new_venue_attributes
        patch api_v0_competition_update_schedule_from_wcif_path(competition), params: schedule.to_json, headers: headers
        # We expect these objects to change!
        expect(venue.reload.name).to eq "new name"
        expect(room.reload.name).to eq "my new third room"
        # but we still want the first one to be untouched
        first_venue = competition.reload.competition_venues.find_by(wcif_id: 1)
        expect(first_venue.name).to eq "Venue 1"
      end

      it "can delete venues and rooms" do
        venue = competition.competition_venues.find_by(wcif_id: 2)
        schedule["venues"][1]["rooms"] = []
        schedule["venues"].delete_at(0)

        patch api_v0_competition_update_schedule_from_wcif_path(competition), params: schedule.to_json, headers: headers
        # We expect this object to change!
        expect(venue.reload.venue_rooms.size).to eq 0
        expect(competition.reload.competition_venues.size).to eq 1
        # We expect the rooms belonging to the deleted venue to be deleted too, so no more room should be there
        expect(VenueRoom.all.size).to eq 0
      end

      it "can update activities and nested activities" do
        room = competition.competition_venues.first.venue_rooms.first
        activity_with_child = room.schedule_activities.find_by(wcif_id: 2)
        wcif_room = schedule["venues"][0]["rooms"][0]
        wcif_room["activities"][1]["name"] = "new name"
        wcif_room["activities"][1]["childActivities"][0]["name"] = "foo"
        wcif_room["activities"][1]["childActivities"][1]["name"] = "bar"

        patch api_v0_competition_update_schedule_from_wcif_path(competition), params: schedule.to_json, headers: headers

        activity_with_child.reload
        expect(activity_with_child.name).to eq "new name"
        expect(activity_with_child.child_activities.find_by(wcif_id: 3).name).to eq "foo"
        expect(activity_with_child.child_activities.find_by(wcif_id: 4).name).to eq "bar"
      end

      it "can delete activities and nested activities" do
        room = competition.competition_venues.first.venue_rooms.first
        activity_with_child = room.schedule_activities.find_by(wcif_id: 2)
        # Remove the nested activity with a child activity
        wcif_room = schedule["venues"][0]["rooms"][0]
        wcif_room["activities"][1]["childActivities"].delete_at(1)
        # Remove an activity
        wcif_room["activities"].delete_at(0)

        patch api_v0_competition_update_schedule_from_wcif_path(competition), params: schedule.to_json, headers: headers

        room.reload
        activity_with_child.reload
        expect(room.schedule_activities.size).to eq 1
        expect(activity_with_child.child_activities.size).to eq 1
        # We expect the nested-nested activity to be destroyed with its parent
        expect(ScheduleActivity.all.size).to eq 2
      end

      it "doesn't change anything when submitting an invalid WCIF" do
        schedule["venues"] = []
        schedule["startDate"] = nil
        expect {
          patch api_v0_competition_update_schedule_from_wcif_path(competition), params: schedule.to_json, headers: headers
        }.to_not change { competition.reload.competition_venues.size }
      end
    end
  end
end

def create_wcif_events(event_ids)
  event_ids.map do |event_id|
    {
      id: event_id,
      rounds: [
        {
          id: "#{event_id}-r1",
          format: "a",
          timeLimit: nil,
          cutoff: nil,
          advancementCondition: nil,
          scrambleSetCount: 1,
        },
      ],
    }
  end
end
