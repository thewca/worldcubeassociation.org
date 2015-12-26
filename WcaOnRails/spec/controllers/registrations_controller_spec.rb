require 'rails_helper'

RSpec.describe RegistrationsController do
  context "signed in as organizer" do
    let(:organizer) { FactoryGirl.create(:user) }
    let(:competition) { FactoryGirl.create(:competition, organizers: [organizer], eventSpecs: "222 333") }
    let(:registration) { FactoryGirl.create(:registration, competitionId: competition.id) }

    before :each do
      sign_in organizer
    end

    it 'allows access to competition organizer' do
      get :index, competition_id: competition
      expect(response.status).to eq 200
    end

    it 'can set name, email, events, countryId for registrations without user' do
      # Change this registration to not have a user
      registration.update_column(:user_id, nil)

      patch :update, id: registration.id, registration: { name: "test name", event_ids: {"222" => "1", "333" => "1" }, email: "foo@bar.com", countryId: "smerbia" }
      registration.reload
      expect(registration.name).to eq "test name"
      expect(registration.eventIds).to eq "333 222"
      expect(registration.email).to eq "foo@bar.com"
      expect(registration.countryId).to eq "smerbia"
    end

    it 'cannot set events that are not offered' do
      competition.update_column(:eventSpecs, "333")

      patch :update, id: registration.id, registration: { event_ids: { "222" => "1", "333" => "1" } }
      registration = assigns(:registration)
      expect(registration.errors.messages[:events]).to eq ["invalid event ids: 222"]
    end

    it 'cannot change registration of a different competition' do
      other_competition = FactoryGirl.create(:competition)
      other_registration = FactoryGirl.create(:registration, competition: other_competition)

      patch :update, id: other_registration.id, registration: { status: :accepted }
      expect(other_registration.reload.eventIds).to eq "333"
      expect(response).to redirect_to root_url
    end

    it "approves a pending registration" do
      expect(RegistrationsMailer).to receive(:accepted_registration).with(registration).and_call_original
      expect do
        patch :update, id: registration.id, registration: { status: Registration::statuses[:accepted] }
      end.to change { ActionMailer::Base.deliveries.length }.by(1)
      expect(registration.reload.accepted?).to be true
    end

    it "can approve multiple registrations" do
      registration2 = FactoryGirl.create(:registration, competitionId: competition.id)

      expect(RegistrationsMailer).to receive(:accepted_registration).with(registration).and_call_original
      expect(RegistrationsMailer).to receive(:accepted_registration).with(registration2).and_call_original
      expect do
        patch :update_all, competition_id: competition.id, registrations_action: "accept-selected", "registration-#{registration.id}": "1", "registration-#{registration2.id}": "1"
      end.to change { ActionMailer::Base.deliveries.length }.by(2)
      expect(registration.reload.accepted?).to be true
      expect(registration2.reload.accepted?).to be true
    end
  end

  context "signed in as competitor" do
    let!(:user) { FactoryGirl.create(:user, :wca_id) }
    let!(:delegate) { FactoryGirl.create(:delegate) }
    let!(:competition) { FactoryGirl.create(:competition, delegates: [delegate]) }

    before :each do
      sign_in user
    end

    it "can create registration" do
      expect(RegistrationsMailer).to receive(:notify_organizers_of_new_registration).and_call_original
      expect(RegistrationsMailer).to receive(:notify_registrant_of_new_registration).and_call_original
      expect do
        post :create, competition_id: competition.id, registration: { event_ids: { "333" => "1" }, guests: "", comments: "" }
      end.to change { ActionMailer::Base.deliveries.length }.by(2)

      registration = Registration.find_by_user_id(user.id)
      expect(registration.competitionId).to eq competition.id
    end

    it "cannot create accepted registration" do
      post :create, competition_id: competition.id, registration: { event_ids: { "333" => "1" }, guests: "", comments: "", status: Registration::statuses[:accepted] }
      registration = Registration.find_by_user_id(user.id)
      expect(registration.pending?).to be true
    end
  end

  context "register" do
    let(:competition) { FactoryGirl.create :competition }

    it "works when not logged in" do
      get :register, competition_id: competition.id
      expect(assigns(:registration)).to eq nil
    end

    it "finds registration when logged in and not registered" do
      registration = FactoryGirl.create(:registration, competition: competition)
      sign_in registration.user

      get :register, competition_id: competition.id
      expect(assigns(:registration)).to eq registration
    end

    it "creates registration when logged in and not registered" do
      user = FactoryGirl.create :user
      sign_in user

      get :register, competition_id: competition.id
      registration = assigns(:registration)
      expect(registration.new_record?).to eq true
      expect(registration.user_id).to eq user.id
    end
  end

  context "psych sheet when not signed in" do
    let!(:competition) { FactoryGirl.create(:competition, eventSpecs: "333 444 333bf") }

    it "redirects psych sheet to 333" do
      get :psych_sheet, competition_id: competition.id
      expect(response).to redirect_to competition_psych_sheet_event_url(competition.id, "333")
    end

    it "redirects psych sheet to highest ranked event if no 333" do
      competition.eventSpecs = "222 444"
      competition.save!

      get :psych_sheet, competition_id: competition.id
      expect(response).to redirect_to competition_psych_sheet_event_url(competition.id, "444")
    end

    it "does not show pending registrations" do
      pending_registration = FactoryGirl.create(:registration, competition: competition)
      RanksAverage.create!(
        personId: pending_registration.personId,
        eventId: "333",
        best: "4242",
        worldRank: 10,
        continentRank: 10,
        countryRank: 10,
      )

      RanksSingle.create!(
        personId: pending_registration.personId,
        eventId: "333",
        best: "2000",
        worldRank: 10,
        continentRank: 10,
        countryRank: 10,
      )

      get :psych_sheet_event, competition_id: competition.id, event_id: "333"
      registrations = assigns(:registrations)
      expect(registrations.map(&:accepted?).all?).to be true
    end

    it "handles user without average" do
      registration = FactoryGirl.create(:registration, :approved, competition: competition)

      get :psych_sheet_event, competition_id: competition.id, event_id: "333"
      registrations = assigns(:registrations)
      expect(registrations.map(&:accepted?).all?).to be true
    end

    it "sorts 444 by average and handles ties" do
      registration1 = FactoryGirl.create(:registration, :approved, competition: competition, eventIds: "444")
      RanksAverage.create!(
        personId: registration1.personId,
        eventId: "444",
        best: "4242",
        worldRank: 10,
        continentRank: 10,
        countryRank: 10,
      )
      RanksSingle.create!(
        personId: registration1.personId,
        eventId: "444",
        best: "2000",
        worldRank: 20,
        continentRank: 10,
        countryRank: 10,
      )

      registration2 = FactoryGirl.create(:registration, :approved, competition: competition, eventIds: "444")
      RanksAverage.create!(
        personId: registration2.personId,
        eventId: "444",
        best: "4242",
        worldRank: 10,
        continentRank: 10,
        countryRank: 10,
      )
      RanksSingle.create!(
        personId: registration2.personId,
        eventId: "444",
        best: "2000",
        worldRank: 10,
        continentRank: 10,
        countryRank: 10,
      )

      registration3 = FactoryGirl.create(:registration, :approved, competition: competition, eventIds: "444")
      RanksAverage.create!(
        personId: registration3.personId,
        eventId: "444",
        best: "4242",
        worldRank: 9,
        continentRank: 9,
        countryRank: 9,
      )

      get :psych_sheet_event, competition_id: competition.id, event_id: "444"
      registrations = assigns(:registrations)
      expect(registrations.map(&:id)).to eq [ registration3.id, registration2.id, registration1.id ]
      expect(registrations.map(&:psych_sheet_position)).to eq [ 1, 2, 2 ]
    end

    it "handles 1 registration" do
      registration = FactoryGirl.create(:registration, :approved, competition: competition, eventIds: "444")
      RanksAverage.create!(
        personId: registration.personId,
        eventId: "444",
        best: "4242",
        worldRank: 10,
        continentRank: 10,
        countryRank: 10,
      )

      get :psych_sheet_event, competition_id: competition.id, event_id: "444"
      registrations = assigns(:registrations)
      expect(registrations.map(&:id)).to eq [ registration.id ]
      expect(registrations.map(&:psych_sheet_position)).to eq [ 1 ]
    end

    it "sorts 333bf by single" do
      registration1 = FactoryGirl.create(:registration, :approved, competition: competition, eventIds: "333bf")
      RanksAverage.create!(
        personId: registration1.personId,
        eventId: "333bf",
        best: "4242",
        worldRank: 10,
        continentRank: 10,
        countryRank: 10,
      )
      RanksSingle.create!(
        personId: registration1.personId,
        eventId: "333bf",
        best: "2000",
        worldRank: 1,
        continentRank: 1,
        countryRank: 1,
      )

      registration2 = FactoryGirl.create(:registration, :approved, competition: competition, eventIds: "333bf")
      RanksAverage.create!(
        personId: registration2.personId,
        eventId: "333bf",
        best: "4242",
        worldRank: 1,
        continentRank: 1,
        countryRank: 1,
      )
      RanksSingle.create!(
        personId: registration2.personId,
        eventId: "333bf",
        best: "2000",
        worldRank: 2,
        continentRank: 2,
        countryRank: 2,
      )

      get :psych_sheet_event, competition_id: competition.id, event_id: "333bf"
      registrations = assigns(:registrations)
      expect(registrations.map(&:id)).to eq [ registration1.id, registration2.id ]
      expect(registrations.map(&:psych_sheet_position)).to eq [ 1, 2 ]
    end

    it "shows first timers on bottom" do
      registration1 = FactoryGirl.create(:registration, :approved, competition: competition, eventIds: "333bf")
      RanksAverage.create!(
        personId: registration1.personId,
        eventId: "333bf",
        best: "4242",
        worldRank: 10,
        continentRank: 10,
        countryRank: 10,
      )
      RanksSingle.create!(
        personId: registration1.personId,
        eventId: "333bf",
        best: "2000",
        worldRank: 1,
        continentRank: 1,
        countryRank: 1,
      )

      # Someone who has never competed in a WCA competition
      user2 = FactoryGirl.create(:user, name: "Zzyzx")
      registration2 = FactoryGirl.create(:registration, :approved, user: user2, competition: competition, eventIds: "333bf")

      # Someone who has never competed in 333bf
      user3 = FactoryGirl.create(:user, :wca_id, name: "Aaron")
      registration3 = FactoryGirl.create(:registration, :approved, user: user3, competition: competition, eventIds: "333bf")

      get :psych_sheet_event, competition_id: competition.id, event_id: "333bf"
      registrations = assigns(:registrations)
      expect(registrations.map(&:id)).to eq [ registration1.id, registration3.id, registration2.id ]
      expect(registrations.map(&:psych_sheet_position)).to eq [ 1, 2, 2 ]
    end

    it "handles 1 registration" do
      registration = FactoryGirl.create(:registration, :approved, competition: competition, eventIds: "444")
      RanksAverage.create!(
        personId: registration.personId,
        eventId: "444",
        best: "4242",
        worldRank: 10,
        continentRank: 10,
        countryRank: 10,
      )

      get :psych_sheet_event, competition_id: competition.id, event_id: "444"
      registrations = assigns(:registrations)
      expect(registrations.map(&:id)).to eq [ registration.id ]
      expect(registrations.map(&:psych_sheet_position)).to eq [ 1 ]
    end
  end
end
