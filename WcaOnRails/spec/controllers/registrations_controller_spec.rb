require 'rails_helper'

RSpec.describe RegistrationsController do
  it 'allows access to competition organizer' do
    organizer = FactoryGirl.create(:user)
    competition = FactoryGirl.create(:competition, organizers: [organizer])
    sign_in organizer
    get :index, competition_id: competition
    expect(response.status).to eq 200
  end

  it 'can set name, email, events, countryId for registrations without user' do
    sign_in FactoryGirl.create(:admin)
    competition = FactoryGirl.create(:competition, eventSpecs: "222 333")
    registration = FactoryGirl.create(:registration, competitionId: competition.id)
    # Change this registration to not have a user
    registration.update_column(:user_id, nil)

    patch :update, competition_id: competition.id, id: registration.id, registration: { name: "test name", eventIds: "222 333", email: "foo@bar.com", countryId: "smerbia" }
    expect(registration.reload.name).to eq "test name"
    expect(registration.reload.eventIds).to eq "333 222"
    expect(registration.reload.email).to eq "foo@bar.com"
    expect(registration.reload.countryId).to eq "smerbia"
  end

  it 'cannot set events that are not offered' do
    sign_in FactoryGirl.create(:admin)
    competition = FactoryGirl.create(:competition, eventSpecs: "333")
    registration = FactoryGirl.create(:registration, competitionId: competition.id)
    patch :update, competition_id: competition.id, id: registration.id, registration: { eventIds: "222 333" }
    registration = assigns(:registration)
    expect(registration.errors.messages[:eventIds]).to eq ["invalid event ids: 222"]
  end

  it 'cannot change registration of a different competition' do
    organizer = FactoryGirl.create(:user)
    competition = FactoryGirl.create(:competition, organizers: [organizer], eventSpecs: "333")
    registration = FactoryGirl.create(:registration, competitionId: competition.id)

    other_competition = FactoryGirl.create(:competition, id: "OtherComp2015", eventSpecs: "333")
    other_registration = FactoryGirl.create(:registration, competitionId: other_competition.id)

    sign_in organizer
    patch :update, competition_id: competition.id, id: other_registration.id, registration: { eventIds: "333" }
    expect(other_registration.reload.eventIds).to eq ""
    expect(response).to redirect_to root_url
  end

  context "signed in as competitor" do
    let(:user) { FactoryGirl.create(:user, :wca_id) }
    let(:competition) { FactoryGirl.create(:competition) }

    before :each do
      sign_in user
    end

    it "can create registration" do
      post :create, competition_id: competition.id, registration: { eventSpecs: "333", guests: "", comments: "" }
      registration = Registration.find_by_personId(user.wca_id)
      expect(registration.competitionId).to eq competition.id
    end
  end
end
