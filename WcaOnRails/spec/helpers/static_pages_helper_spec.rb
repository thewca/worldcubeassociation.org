# frozen_string_literal: true
require "rails_helper"

RSpec.describe StaticPagesHelper do
  describe "#format_team_members" do
    it "returns the team structure" do
      team = FactoryGirl.create(:team)
      member = FactoryGirl.create(:user, name: "Jeremy")
      other_member = FactoryGirl.create(:user, name: "Pedro")
      another_member = FactoryGirl.create(:user, name: "Aaron")
      FactoryGirl.create(:team_member, team_id: team.id, user_id: member.id, start_date: Date.today-1, team_leader: true)
      FactoryGirl.create(:team_member, team_id: team.id, user_id: other_member.id, start_date: Date.today-1)
      FactoryGirl.create(:team_member, team_id: team.id, user_id: another_member.id, start_date: Date.today-1)
      string = helper.format_team_members(team.friendly_id)
      expect(string).to eq "Jeremy (leader), Aaron, and Pedro"
    end

    it "does not include the demoted members" do
      team = FactoryGirl.create(:team)
      leader = FactoryGirl.create(:user, name: "Jeremy")
      present_member = FactoryGirl.create(:user, name: "Pedro")
      demoted_member = FactoryGirl.create(:user, name: "Aaron")
      FactoryGirl.create(:team_member, team_id: team.id, user_id: leader.id, start_date: Date.today-1, team_leader: true)
      FactoryGirl.create(:team_member, team_id: team.id, user_id: present_member.id, start_date: Date.today-1)
      FactoryGirl.create(:team_member, team_id: team.id, user_id: demoted_member.id, start_date: Date.today-10, end_date: Date.today-1)
      string = helper.format_team_members(team.friendly_id)
      expect(string).to eq "Jeremy (leader) and Pedro"
    end
  end
end
