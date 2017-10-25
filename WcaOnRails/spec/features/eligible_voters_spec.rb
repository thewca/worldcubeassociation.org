# frozen_string_literal: true

require "rails_helper"
require "csv"

RSpec.feature "Eligible voters csv" do
  let!(:wrc_team_id) { Team.find_by_friendly_id("wrc") }

  let!(:user) { FactoryBot.create(:user) }
  let!(:former_team_leader) {
    FactoryBot.create(:user, :wrc_member).tap do |user|
      user.team_members.find_by_team_id(wrc_team_id).update!(team_leader: true, end_date: 1.day.ago)
    end
  }
  let!(:team_leader) {
    FactoryBot.create(:user, :wrc_member).tap do |user|
      user.team_members.find_by_team_id(wrc_team_id).update!(team_leader: true)
    end
  }
  let!(:team_member) { FactoryBot.create(:user, :wrc_member) }
  let!(:candidate_delegate) { FactoryBot.create(:candidate_delegate) }
  let!(:delegate) { FactoryBot.create(:delegate) }
  let!(:delegate_who_is_also_team_leader) {
    FactoryBot.create(:delegate, :wrc_member).tap do |user|
      user.team_members.find_by_team_id(wrc_team_id).update!(team_leader: true)
    end
  }
  let!(:senior_delegate) { FactoryBot.create(:senior_delegate) }
  let!(:board_member) { FactoryBot.create(:board_member) }

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
