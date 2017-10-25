# frozen_string_literal: true

require "rails_helper"

RSpec.describe StaticPagesHelper do
  describe "#format_team_members" do
    it "returns the team structure" do
      team = FactoryBot.create(:team)
      member = FactoryBot.create(:user, name: "Jeremy")
      other_member = FactoryBot.create(:user, name: "Pedro")
      another_member = FactoryBot.create(:user, name: "Aaron")
      FactoryBot.create(:team_member, team_id: team.id, user_id: member.id, start_date: Date.today-1, team_leader: true)
      FactoryBot.create(:team_member, team_id: team.id, user_id: other_member.id, start_date: Date.today-1)
      FactoryBot.create(:team_member, team_id: team.id, user_id: another_member.id, start_date: Date.today-1)
      string = helper.format_team_members(team)
      expect(string).to eq "Jeremy (leader), Aaron, and Pedro"
    end

    it "does not include the demoted members" do
      team = FactoryBot.create(:team)
      leader = FactoryBot.create(:user, name: "Jeremy")
      present_member = FactoryBot.create(:user, name: "Pedro")
      demoted_member = FactoryBot.create(:user, name: "Aaron")
      FactoryBot.create(:team_member, team_id: team.id, user_id: leader.id, start_date: Date.today-1, team_leader: true)
      FactoryBot.create(:team_member, team_id: team.id, user_id: present_member.id, start_date: Date.today-1)
      FactoryBot.create(:team_member, team_id: team.id, user_id: demoted_member.id, start_date: Date.today-10, end_date: Date.today-1)
      string = helper.format_team_members(team)
      expect(string).to eq "Jeremy (leader) and Pedro"
    end
  end
end
