require 'rails_helper'

RSpec.describe RegistrationsController do
  it 'allows access to competition organizer' do
    organizer = FactoryGirl.create(:user)
    competition = FactoryGirl.create(:competition, organizers: [organizer])
    sign_in organizer
    get :index, id: competition
    expect(response.status).to eq 200
  end
end
