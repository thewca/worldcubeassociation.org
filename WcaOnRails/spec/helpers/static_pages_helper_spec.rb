# frozen_string_literal: true
require "rails_helper"

describe StaticPagesHelper do
  describe "#format_team_members" do
    it "returns the team structure" do
      team = FactoryGirl.create(:team)
      member = FactoryGirl.create(:user, name: "Jeremy")
      other_member = FactoryGirl.create(:user, name: "Pedro")
      another_member = FactoryGirl.create(:user, name: "Aaron")
      FactoryGirl.create(:team_member, :team_leader, team: team, user: member, start_date: Date.today-1)
      FactoryGirl.create(:team_member, team: team, user: other_member, start_date: Date.today-1)
      FactoryGirl.create(:team_member, team: team, user: another_member, start_date: Date.today-1)
      string = helper.format_team_members(team.slug)
      expect(string).to eq "Jeremy (leader), Aaron, and Pedro"
    end

    it "does not include the demoted members" do
      team = FactoryGirl.create(:team)
      leader = FactoryGirl.create(:user, name: "Jeremy")
      present_member = FactoryGirl.create(:user, name: "Pedro")
      demoted_member = FactoryGirl.create(:user, name: "Aaron")
      FactoryGirl.create(:team_member, :team_leader, team: team, user: leader, start_date: Date.today-1)
      FactoryGirl.create(:team_member, team: team, user: present_member, start_date: Date.today-1)
      FactoryGirl.create(:team_member, team: team, user: demoted_member, start_date: Date.today-10, end_date: Date.today-1)
      string = helper.format_team_members(team.slug)
      expect(string).to eq "Jeremy (leader) and Pedro"
    end
  end
end
