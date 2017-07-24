# frozen_string_literal: true

require "rails_helper"
require "csv"

RSpec.feature "Eligible voters csv" do
  let!(:wrc_team_id) { Team.find_by_friendly_id("wrc") }

  let!(:user) { FactoryGirl.create(:user) }
  let!(:former_team_leader) {
    FactoryGirl.create(:user, :wrc_member).tap do |user|
      user.team_members.find_by_team_id(wrc_team_id).update!(team_leader: true, end_date: 1.day.ago)
    end
  }
  let!(:team_leader) {
    FactoryGirl.create(:user, :wrc_member).tap do |user|
      user.team_members.find_by_team_id(wrc_team_id).update!(team_leader: true)
    end
  }
  let!(:team_member) { FactoryGirl.create(:user, :wrc_member) }
  let!(:candidate_delegate) { FactoryGirl.create(:candidate_delegate) }
  let!(:delegate) { FactoryGirl.create(:delegate) }
  let!(:delegate_who_is_also_team_leader) {
    FactoryGirl.create(:delegate, :wrc_member).tap do |user|
      user.team_members.find_by_team_id(wrc_team_id).update!(team_leader: true)
    end
  }
  let!(:senior_delegate) { FactoryGirl.create(:senior_delegate) }
  let!(:board_member) { FactoryGirl.create(:board_member) }

  before :each do
    sign_in board_member
  end

  it 'includes all voters' do
    visit "/admin/voters.csv"
    csv = CSV.parse(page.body)
    expect(csv).to match_array [
      ["name", "email"],
      [team_leader.name, team_leader.email],
      [delegate.name, delegate.email],
      [delegate_who_is_also_team_leader.name, delegate_who_is_also_team_leader.email],
      [senior_delegate.name, senior_delegate.email],
      [board_member.name, board_member.email],
    ]
  end
end
