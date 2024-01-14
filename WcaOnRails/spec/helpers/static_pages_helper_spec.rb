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

  describe "#badge_for_members" do
    it "returns leader badge when user is leader" do
      team = FactoryBot.create(:team)
      member = FactoryBot.create(:user, name: "Jeremy")
      tm = FactoryBot.create(:team_member, team_id: team.id, user_id: member.id, start_date: Date.today-1, team_leader: true)
      string = helper.badge_for_member(tm)
      expect(string).to eq "team-leader-badge"
    end

    it "returns senior member badge when user is senior_member" do
      team = FactoryBot.create(:team)
      other_member = FactoryBot.create(:user, name: "Pedro")
      tm = FactoryBot.create(:team_member, team_id: team.id, user_id: other_member.id, start_date: Date.today-1, team_senior_member: true)
      string = helper.badge_for_member(tm)
      expect(string).to eq "team-senior-member-badge"
    end

    it "returns no badge when user is neither leader nor senior member" do
      team = FactoryBot.create(:team)
      another_member = FactoryBot.create(:user, name: "Aaron")
      tm = FactoryBot.create(:team_member, team_id: team.id, user_id: another_member.id, start_date: Date.today-1)
      string = helper.badge_for_member(tm)
      expect(string).to eq nil
    end
  end

  describe "#subtext_for_member" do
    it "returns leader subtext when user is leader" do
      team = FactoryBot.create(:team)
      member = FactoryBot.create(:user, name: "Jeremy")
      tm = FactoryBot.create(:team_member, team_id: team.id, user_id: member.id, start_date: Date.today-1, team_leader: true)
      string = helper.subtext_for_member(tm)
      expect(string).to eq t("about.structure.leader")
    end

    it "returns senior member subtext when user is senior_member" do
      team = FactoryBot.create(:team)
      other_member = FactoryBot.create(:user, name: "Pedro")
      tm = FactoryBot.create(:team_member, team_id: team.id, user_id: other_member.id, start_date: Date.today-1, team_senior_member: true)
      string = helper.subtext_for_member(tm)
      expect(string).to eq t("about.structure.senior_member")
    end

    it "returns no subtext when user is neither leader nor senior member" do
      team = FactoryBot.create(:team)
      another_member = FactoryBot.create(:user, name: "Aaron")
      tm = FactoryBot.create(:team_member, team_id: team.id, user_id: another_member.id, start_date: Date.today-1)
      string = helper.subtext_for_member(tm)
      expect(string).to eq nil
    end
  end

  describe "#team_member_name" do
    it "Adds team member name div" do
      name = "Max Faster"
      string = helper.team_member_name(name) { "Max Faster" }
      expect(string).to eq "<div class=\"team-member-name\">Max Faster<br><span class=\"team-subtext\">Max Faster</span></div>"
    end
  end

  describe "#format_team_member_content" do
    it "Doesn't add a link when there's no WCA ID" do
      member = FactoryBot.create(:user, name: "Peter")
      string = helper.format_team_member_content(member) { member.name }
      expect(string).to eq "<div class=\"team-member-name\">Peter<br><span class=\"team-subtext\">Peter</span></div>"
    end

    it "Adds a link when there's WCA ID" do
      member = FactoryBot.create(:person, name: "Peter", wca_id: "2000PETE01")
      string = helper.format_team_member_content(member) {}
      expect(string).to include "href=\"/persons/2000PETE01\">Peter</a>"
    end
  end
end
