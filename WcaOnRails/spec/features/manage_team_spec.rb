# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Manage team" do
  let!(:results_team) { Team.find_by_friendly_id("wrt") }
  let!(:results_team_member) { FactoryGirl.create(:user, :wrt_member) }

  before(:each) { sign_in FactoryGirl.create(:admin) }

  it 'remove member from team' do
    visit "/teams/#{results_team.id}/edit"
    fill_in "team_team_members_attributes_0_end_date", with: Date.today.to_s

    expect(results_team_member.current_teams).to eq [results_team]
    click_button "Update Team"
    expect(results_team_member.reload.current_teams).to eq []
  end
end
