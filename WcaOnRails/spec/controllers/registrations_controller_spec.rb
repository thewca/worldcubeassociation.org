require 'rails_helper'

RSpec.describe RegistrationsController do
  context "signed in as organizer" do
    let(:organizer) { FactoryGirl.create(:user) }
    let(:competition) { FactoryGirl.create(:competition, :registration_open, organizers: [organizer], eventSpecs: "222 333") }
    let(:zzyzx_user) { FactoryGirl.create :user, name: "Zzyzx" }
    let(:registration) { FactoryGirl.create(:registration, competitionId: competition.id, user: zzyzx_user) }
    let(:registration_without_user) {
      u = FactoryGirl.build(:registration, competitionId: competition.id, name: "Aaron", user: nil)
      u.save!(validate: false)
      u
    }

    before :each do
      sign_in organizer
    end

    it 'allows access to competition organizer' do
      get :index, competition_id: competition
      expect(response.status).to eq 200
    end

    it 'sorts by name, even if name is unpopulated because they registered with a WCA account' do
      # First accept registrations
      registration.update_column(:status, "a")
      registration_without_user.update_column(:status, "a")

      get :index, competition_id: competition
      registrations = assigns(:registrations)
      expect(registrations.length).to eq 2
      expect(registrations[0].name).to eq "Aaron"
      expect(registrations[1].name).to eq "Zzyzx"
    end

    it 'can set name, email, events, countryId for registrations without user' do
      patch :update, id: registration_without_user.id, registration: { name: "test name", event_ids: {"222" => "1", "333" => "1" }, email: "foo@bar.com", countryId: "smerbia" }
      registration_without_user.reload
      expect(registration_without_user.name).to eq "test name"
      expect(registration_without_user.eventIds).to eq "333 222"
      expect(registration_without_user.email).to eq "foo@bar.com"
      expect(registration_without_user.countryId).to eq "smerbia"
    end

    it 'cannot set events that are not offered' do
      competition.update_column(:eventSpecs, "333")

      patch :update, id: registration.id, registration: { event_ids: { "222" => "1", "333" => "1" } }
      registration = assigns(:registration)
      expect(registration.errors.messages[:events]).to eq ["invalid event ids: 222"]
    end

    it 'cannot change registration of a different competition' do
      other_competition = FactoryGirl.create(:competition, :registration_open)
      other_registration = FactoryGirl.create(:registration, competition: other_competition)

      patch :update, id: other_registration.id, registration: { status: :accepted }
      expect(other_registration.reload.eventIds).to eq "333"
      expect(response).to redirect_to root_url
      expect(flash[:danger]).to match "not allowed to can_manage_competition?"
    end

    it "accepts a pending registration" do
      expect(RegistrationsMailer).to receive(:notify_registrant_of_accepted_registration).with(registration).and_call_original
      expect do
        patch :update, id: registration.id, registration: { status: Registration::statuses[:accepted] }
      end.to change { ActionMailer::Base.deliveries.length }.by(1)
      expect(registration.reload.accepted?).to be true
    end

    it "changes an accepted registration to pending" do
      registration.accepted!

      expect(RegistrationsMailer).to receive(:notify_registrant_of_pending_registration).with(registration).and_call_original
      expect do
        patch :update, id: registration.id, registration: { status: Registration::statuses[:pending] }
      end.to change { ActionMailer::Base.deliveries.length }.by(1)
      expect(registration.reload.pending?).to be true
    end

    it "can delete registration" do
      expect(RegistrationsMailer).to receive(:notify_registrant_of_deleted_registration).with(registration).and_call_original

      expect do
        delete :destroy, id: registration.id
      end.to change { ActionMailer::Base.deliveries.length }.by(1)

      expect(flash[:success]).to eq "Deleted registration and emailed #{registration.email}"
      expect(Registration.find_by_id(registration.id)).to eq nil
    end

    it "can delete multiple registrations" do
      registration2 = FactoryGirl.create(:registration, competitionId: competition.id)

      expect(RegistrationsMailer).to receive(:notify_registrant_of_deleted_registration).with(registration).and_call_original
      expect(RegistrationsMailer).to receive(:notify_registrant_of_deleted_registration).with(registration2).and_call_original
      expect do
        patch :update_all, competition_id: competition.id, registrations_action: "delete-selected", "registration-#{registration.id}": "1", "registration-#{registration2.id}": "1"
      end.to change { ActionMailer::Base.deliveries.length }.by(2)
      expect(Registration.find_by_id(registration.id)).to eq nil
      expect(Registration.find_by_id(registration2.id)).to eq nil
    end

    it "can reject multiple registrations" do
      registration.accepted!
      registration2 = FactoryGirl.create(:registration, :accepted, competitionId: competition.id)
      pending_registration = FactoryGirl.create(:registration, :pending, competitionId: competition.id)

      expect(RegistrationsMailer).to receive(:notify_registrant_of_pending_registration).with(registration).and_call_original
      expect(RegistrationsMailer).to receive(:notify_registrant_of_pending_registration).with(registration2).and_call_original
      # We shouldn't notify people who were already on the waiting list that they're
      # still on the waiting list.
      expect(RegistrationsMailer).not_to receive(:notify_registrant_of_pending_registration).with(pending_registration).and_call_original
      expect do
        patch :update_all, competition_id: competition.id, registrations_action: "reject-selected", "registration-#{registration.id}": "1", "registration-#{registration2.id}": "1", "registration-#{pending_registration.id}": "1"
      end.to change { ActionMailer::Base.deliveries.length }.by(2)
      expect(registration.reload.pending?).to be true
      expect(registration2.reload.pending?).to be true
      expect(pending_registration.reload.pending?).to be true
    end

    it "can accept multiple registrations" do
      registration2 = FactoryGirl.create(:registration, competitionId: competition.id)
      accepted_registration = FactoryGirl.create(:registration, :accepted, competitionId: competition.id)

      expect(RegistrationsMailer).to receive(:notify_registrant_of_accepted_registration).with(registration).and_call_original
      expect(RegistrationsMailer).to receive(:notify_registrant_of_accepted_registration).with(registration2).and_call_original
      # We shouldn't notify people who were already accepted that they're
      # still accepted.
      expect(RegistrationsMailer).not_to receive(:notify_registrant_of_accepted_registration).with(accepted_registration).and_call_original
      expect do
        patch :update_all, competition_id: competition.id, registrations_action: "accept-selected", "registration-#{registration.id}": "1", "registration-#{registration2.id}": "1", "registration-#{accepted_registration.id}": "1"
      end.to change { ActionMailer::Base.deliveries.length }.by(2)
      expect(registration.reload.accepted?).to be true
      expect(registration2.reload.accepted?).to be true
      expect(accepted_registration.reload.accepted?).to be true
    end
  end

  context "signed in as competitor" do
    let!(:user) { FactoryGirl.create(:user, :wca_id) }
    let!(:delegate) { FactoryGirl.create(:delegate) }
    let!(:competition) { FactoryGirl.create(:competition, :registration_open, delegates: [delegate]) }

    before :each do
      sign_in user
    end

    it "can create registration" do
      expect(RegistrationsMailer).to receive(:notify_organizers_of_new_registration).and_call_original
      expect(RegistrationsMailer).to receive(:notify_registrant_of_new_registration).and_call_original
      expect do
        post :create, competition_id: competition.id, registration: { event_ids: { "333" => "1" }, guests: 1, comments: "" }
      end.to change { ActionMailer::Base.deliveries.length }.by(2)

      registration = Registration.find_by_user_id(user.id)
      expect(registration.competitionId).to eq competition.id
    end

    it "can delete registration" do
      registration = FactoryGirl.create :registration, competitionId: competition.id, user_id: user.id

      expect(RegistrationsMailer).to receive(:notify_organizers_of_deleted_registration).and_call_original
      expect do
        delete :destroy, id: registration.id, user_is_deleting_theirself: true
      end.to change { ActionMailer::Base.deliveries.length }.by(1)

      expect(response).to redirect_to competition_path(competition) + '/register'
      expect(Registration.find_by_id(registration.id)).to eq nil
    end

    it "cannnot delete other people's registrations" do
      user_registration = FactoryGirl.create :registration, competitionId: competition.id, user_id: user.id
      other_registration = FactoryGirl.create :registration, competitionId: competition.id
      delete :destroy, id: other_registration.id, user_is_deleting_theirself: true
      expect(response).to redirect_to competition_path(competition) + '/register'
      expect(Registration.find_by_id(other_registration.id)).to eq other_registration
    end

    it "cannot create accepted registration" do
      post :create, competition_id: competition.id, registration: { event_ids: { "333" => "1" }, guests: 0, comments: "", status: Registration::statuses[:accepted] }
      registration = Registration.find_by_user_id(user.id)
      expect(registration.pending?).to be true
    end

    it "cannot create registration after registration is closed" do
      competition.registration_open = 2.weeks.ago
      competition.registration_close = 1.week.ago
      competition.save!

      post :create, competition_id: competition.id, registration: { event_ids: { "333" => "1" }, guests: 1, comments: "", status: Registration::statuses[:accepted] }
      expect(response).to redirect_to competition_path(competition)
      expect(flash[:danger]).to eq "You cannot register for this competition, registration is closed"
    end
  end

  context "register" do
    let(:competition) { FactoryGirl.create :competition, :registration_open }

    it "redirects to competition root if competition is not using WCA registration" do
      competition.use_wca_registration = false
      competition.save!

      get :register, competition_id: competition.id
      expect(response).to redirect_to competition_path(competition)
      expect(flash[:danger]).to match "not using WCA registration"
    end

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

  context "competition not visible" do
    let(:organizer) { FactoryGirl.create :user }
    let(:competition) { FactoryGirl.create(:competition, :registration_open, eventSpecs: "333 444 333bf", showAtAll: false, organizers: [organizer]) }

    it "404s when competition is not visible to public" do
      expect {
        get :psych_sheet_event, competition_id: competition.id, event_id: "333"
      }.to raise_error(ActionController::RoutingError)
    end

    it "organizer can access psych sheet" do
      sign_in organizer

      get :psych_sheet_event, competition_id: competition.id, event_id: "333"
      expect(response.status).to eq 200
    end
  end

  context "psych sheet when not signed in" do
    let!(:competition) { FactoryGirl.create(:competition, :registration_open, eventSpecs: "333 444 333bf") }

    it "redirects psych sheet to 333" do
      get :psych_sheet, competition_id: competition.id
      expect(response).to redirect_to competition_psych_sheet_event_url(competition.id, "333")
    end

    it "redirects to root if competition is not using WCA registration" do
      competition.use_wca_registration = false
      competition.save!

      get :psych_sheet, competition_id: competition.id
      expect(response).to redirect_to competition_path(competition)
      expect(flash[:danger]).to match "not using WCA registration"

      get :psych_sheet_event, competition_id: competition.id, event_id: "333"
      expect(response).to redirect_to competition_path(competition)
      expect(flash[:danger]).to match "not using WCA registration"

      get :index, competition_id: competition.id
      expect(response).to redirect_to competition_path(competition)
      expect(flash[:danger]).to match "not using WCA registration"
    end


    it "redirects psych sheet to highest ranked event if no 333" do
      competition.eventSpecs = "222 444"
      competition.save!

      get :psych_sheet, competition_id: competition.id
      expect(response).to redirect_to competition_psych_sheet_event_url(competition.id, "444")
    end

    it "does not show pending registrations" do
      pending_registration = FactoryGirl.create(:registration, competition: competition)
      FactoryGirl.create :ranks_average, rank: 10, best: 4242, eventId: "333", personId: pending_registration.personId
      FactoryGirl.create :ranks_average, rank: 10, best: 2000, eventId: "333", personId: pending_registration.personId

      get :psych_sheet_event, competition_id: competition.id, event_id: "333"
      registrations = assigns(:registrations)
      expect(registrations.map(&:accepted?).all?).to be true
    end

    it "handles user without average" do
      registration = FactoryGirl.create(:registration, :accepted, competition: competition)

      get :psych_sheet_event, competition_id: competition.id, event_id: "333"
      registrations = assigns(:registrations)
      expect(registrations.map(&:accepted?).all?).to be true
    end

    it "sorts 444 by average and handles ties" do
      registration1 = FactoryGirl.create(:registration, :accepted, competition: competition, eventIds: "444")
      FactoryGirl.create :ranks_average, rank: 10, best: 4242, eventId: "444", personId: registration1.personId
      FactoryGirl.create :ranks_single, rank: 20, best: 2000, eventId: "444", personId: registration1.personId

      registration2 = FactoryGirl.create(:registration, :accepted, competition: competition, eventIds: "444")
      FactoryGirl.create :ranks_average, rank: 10, best: 4242, eventId: "444", personId: registration2.personId
      FactoryGirl.create :ranks_single, rank: 10, best: 2000, eventId: "444", personId: registration2.personId

      registration3 = FactoryGirl.create(:registration, :accepted, competition: competition, eventIds: "444")
      FactoryGirl.create :ranks_average, rank: 9, best: 4242, eventId: "444", personId: registration3.personId

      get :psych_sheet_event, competition_id: competition.id, event_id: "444"
      registrations = assigns(:registrations)
      expect(registrations.map(&:id)).to eq [ registration3.id, registration2.id, registration1.id ]
      expect(registrations.map(&:position)).to eq [ 1, 2, 2 ]
      expect(registrations.map(&:tied_previous)).to eq [ false, false, true ]
    end

    it "handles missing average" do
      # Missing an average
      registration1 = FactoryGirl.create(:registration, :accepted, competition: competition, eventIds: "444")
      FactoryGirl.create :ranks_single, rank: 2, best: 200, eventId: "444", personId: registration1.personId

      registration2 = FactoryGirl.create(:registration, :accepted, competition: competition, eventIds: "444")
      FactoryGirl.create :ranks_average, rank: 10, best: 4242, eventId: "444", personId: registration2.personId
      FactoryGirl.create :ranks_single, rank: 10, best: 2000, eventId: "444", personId: registration2.personId

      # Never competed
      registration3 = FactoryGirl.create(:registration, :accepted, competition: competition, eventIds: "444")

      get :psych_sheet_event, competition_id: competition.id, event_id: "444"
      registrations = assigns(:registrations)
      expect(registrations.map(&:id)).to eq [ registration2.id, registration1.id, registration3.id ]
      expect(registrations.map(&:position)).to eq [ 1, nil, nil ]
    end

    it "handles 1 registration" do
      registration = FactoryGirl.create(:registration, :accepted, competition: competition, eventIds: "444")
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
      expect(registrations.map(&:position)).to eq [ 1 ]
    end

    it "sorts 333bf by single" do
      registration1 = FactoryGirl.create(:registration, :accepted, competition: competition, eventIds: "333bf")
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

      registration2 = FactoryGirl.create(:registration, :accepted, competition: competition, eventIds: "333bf")
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
      expect(registrations.map(&:position)).to eq [ 1, 2 ]
    end

    it "shows first timers on bottom" do
      registration1 = FactoryGirl.create(:registration, :accepted, competition: competition, eventIds: "333bf")
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
      registration2 = FactoryGirl.create(:registration, :accepted, user: user2, competition: competition, eventIds: "333bf")

      # Someone who has never competed in 333bf
      user3 = FactoryGirl.create(:user, :wca_id, name: "Aaron")
      registration3 = FactoryGirl.create(:registration, :accepted, user: user3, competition: competition, eventIds: "333bf")

      get :psych_sheet_event, competition_id: competition.id, event_id: "333bf"
      registrations = assigns(:registrations)
      expect(registrations.map(&:id)).to eq [ registration1.id, registration3.id, registration2.id ]
      expect(registrations.map(&:position)).to eq [ 1, nil, nil ]
    end

    it "handles 1 registration" do
      registration = FactoryGirl.create(:registration, :accepted, competition: competition, eventIds: "444")
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
      expect(registrations.map(&:position)).to eq [ 1 ]
    end
  end
end
