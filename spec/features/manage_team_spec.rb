# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Manage team" do
  let!(:banned_team) { Team.banned }
  let!(:banned_user) { FactoryBot.create(:user, :banned) }

  before(:each) do
    sign_in FactoryBot.create(:admin)
  end

  it 'remove member from team' do
    visit "/teams/#{banned_team.id}/edit"
    fill_in "team_team_members_attributes_0_end_date", with: Date.today.to_s

    expect(banned_user.current_teams).to eq [banned_team]
    click_button "Update Team"
    expect(banned_user.reload.current_teams).to eq []
  end
end
