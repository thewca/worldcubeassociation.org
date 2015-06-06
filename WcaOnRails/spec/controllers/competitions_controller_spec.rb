require 'rails_helper'

describe CompetitionsController do
  login_admin

  let(:competition) { FactoryGirl.create(:competition) }

  it 'redirects organiser view to organiser view' do
    patch :update, id: competition, competition: { name: competition.name }
    expect(response).to redirect_to edit_competition_path(competition)
  end

  it 'redirects admin view to admin view' do
    patch :update, id: competition, competition: { name: competition.name }, admin_view: true
    expect(response).to redirect_to admin_edit_competition_path(competition)
  end

  it 'can confirm competition' do
    patch :update, id: competition, competition: { name: competition.name }, commit: "Confirm"
    expect(response).to redirect_to edit_competition_path(competition)
    expect(competition.reload.isConfirmed?).to eq true
  end

  it 'clears showPreregList if not showPreregForm' do
    competition.update_attributes(showPreregForm: true, showPreregList: true)
    patch :update, id: competition, competition: { showPreregForm: false }
    expect(competition.reload.showPreregList).to eq false
  end
end
