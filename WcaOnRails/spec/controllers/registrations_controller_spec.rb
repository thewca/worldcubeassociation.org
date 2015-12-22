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
end
