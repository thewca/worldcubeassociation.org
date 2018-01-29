# frozen_string_literal: true

require "rails_helper"
require "csv"

RSpec.feature "Eligible voters csv" do
  before { Timecop.freeze(Time.utc(2016, 5, 5, 10, 5, 3)) }
  after { Timecop.return }

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
  let!(:board_member) { FactoryBot.create(:user, :board_member) }

  before :each do
    sign_in board_member
  end

  it 'includes all voters' do
    visit "/admin/voters.csv"

    expect(page.response_headers['Content-Disposition']).to eq 'attachment; filename="wca-voters-2016-05-05T10:05:03Z.csv"'

    csv = CSV.parse(page.body)
    expect(csv).to match_array [
      ["id", "email", "name"],
      [team_leader.id.to_s, team_leader.email, team_leader.name],
      [delegate.id.to_s, delegate.email, delegate.name],
      [delegate_who_is_also_team_leader.id.to_s, delegate_who_is_also_team_leader.email, delegate_who_is_also_team_leader.name],
      [senior_delegate.id.to_s, senior_delegate.email, senior_delegate.name],
      [board_member.id.to_s, board_member.email, board_member.name],
    ]
  end
end
