# frozen_string_literal: true

require "rails_helper"

RSpec.describe "teams/index.html.erb" do
  describe "when signed in as an admin" do
    let!(:user) { FactoryBot.create :admin }
    let!(:teams) { Team.all_official }
    let!(:team_member) { FactoryBot.create :team_member, user_id: user.id, team_id: teams.first.id }

    before do
      allow(view).to receive(:current_user) { user }
      assign(:teams, teams)
      render
    end

    it "lists teams" do
      teams.each do |team|
        expect(rendered).to match team.name
      end
    end

    it "shows members of a team" do
      expect(rendered).to match user.name
    end
  end
end
