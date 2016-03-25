require "rails_helper"

describe StaticPagesHelper do
  describe "#format_team_members" do
    it "returns the team structure" do
      team = FactoryGirl.create(:team)
      member = FactoryGirl.create(:user, name: "Jeremy")
      other_member = FactoryGirl.create(:user, name: "Pedro")
      team_member = FactoryGirl.create(:team_member, team_id: team.id, user_id: member.id, start_date: Date.today-1, team_leader: true)
      other_team_member = FactoryGirl.create(:team_member, team_id: team.id, user_id: other_member.id, start_date: Date.today-1)
      string = helper.format_team_members(team.friendly_id)
      expect(string).to eq "Jeremy (leader), Pedro"
    end
  end
end