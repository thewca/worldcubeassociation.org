# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Team do
  let(:names) { ["Larry Ullrich", "Jeffry Kiehn", "Colby Nader", "Lakia Cremin", "Shanae Price", "Ka Hermiston", "Milton Pfeffer", "Jolie Cartwright", "Alana Monahan", "Elden Cruickshank"] }
  let(:users) { [] }
  let(:wrt_team) { FactoryBot.create :team, friendly_id: 'wrt' }

  before(:each) do
    names.each do |name|
      users.append(FactoryBot.create(:user, name: name))
    end
  end

  before do
    FactoryBot.create :team_member, user_id: users[0].id, team_id: wrt_team.id, start_date: Time.now - 10.months, team_leader: true, updated_at: Time.now - 10.months
    FactoryBot.create :team_member, user_id: users[1].id, team_id: wrt_team.id, start_date: Time.now - 10.months, team_senior_member: true, updated_at: Time.now - 10.months
    FactoryBot.create :team_member, user_id: users[2].id, team_id: wrt_team.id, start_date: Time.now - 10.months, team_senior_member: true, updated_at: Time.now - 10.months
    FactoryBot.create :team_member, user_id: users[3].id, team_id: wrt_team.id, start_date: Time.now - 10.months, updated_at: Time.now - 10.months
    FactoryBot.create :team_member, user_id: users[4].id, team_id: wrt_team.id, start_date: Time.now - 10.months, updated_at: Time.now - 10.months
    FactoryBot.create :team_member, user_id: users[5].id, team_id: wrt_team.id, start_date: Time.now - 10.months, updated_at: Time.now - 10.months
    wrt_team.reload
  end

  it "Added 2 new members" do
    FactoryBot.create :team_member, user_id: users[6].id, team_id: wrt_team.id, start_date: Time.now - 4.days
    FactoryBot.create :team_member, user_id: users[7].id, team_id: wrt_team.id, start_date: Time.now - 4.days

    expected_output = [
      "Changes in WCA Results Team",
      "",
      "New Members",
      "Jolie Cartwright",
      "Milton Pfeffer",
      "",
    ].join("\n")
    expect(wrt_team.reload.changes_in_team).to eq expected_output
  end

  it "Promoted 1 member" do
    team_member = wrt_team.team_members[3]
    team_member.update_columns(end_date: Time.now - 5.days, updated_at: Time.now - 5.days)
    FactoryBot.create :team_member, user_id: team_member.user.id, team_id: wrt_team.id, start_date: Time.now - 5.days, team_senior_member: true

    expected_output = [
      "Changes in WCA Results Team",
      "",
      "Promoted Senior Members",
      "Lakia Cremin",
      "",
    ].join("\n")
    expect(wrt_team.reload.changes_in_team).to eq expected_output
  end

  it "Leader resigned and another person became leader" do
    cur_leader = wrt_team.team_members[0]
    new_leader = wrt_team.team_members[1]
    cur_leader.update_columns(end_date: Time.now - 10.days, updated_at: Time.now - 10.days)
    new_leader.update_columns(end_date: Time.now - 10.days, updated_at: Time.now - 10.days)
    FactoryBot.create :team_member, user_id: users[0].id, team_id: wrt_team.id, start_date: Time.now - 10.days, team_senior_member: true
    FactoryBot.create :team_member, user_id: new_leader.user.id, team_id: wrt_team.id, start_date: Time.now - 10.days, team_leader: true

    expected_output = [
      "Changes in WCA Results Team",
      "",
      "Leaders",
      "Jeffry Kiehn has been appointed as the new Leader.",
      "Larry Ullrich is no longer the Leader, but will continue as Senior member.",
      "",
    ].join("\n")
    puts(wrt_team.reload.changes_in_team)
    expect(wrt_team.reload.changes_in_team).to eq expected_output
  end
end
