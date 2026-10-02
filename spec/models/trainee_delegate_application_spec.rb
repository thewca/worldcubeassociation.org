# frozen_string_literal: true

require "rails_helper"

RSpec.describe TraineeDelegateApplication do
  describe "#volunteer_role_history" do
    let(:applicant) { create(:user_with_wca_id) }

    it "lists volunteer roles and excludes translators, bans, and probation" do
      team_role = create(:wrt_member_role, user: applicant, start_date: Date.new(2020, 1, 2), end_date: Date.new(2021, 3, 4))
      board_role = create(:board_role, user: applicant)
      create(:translator_role, user: applicant)
      create(:banned_competitor_role, user: applicant)
      create(:probation_role, user: applicant)

      role_history = described_class.new(applicant: applicant).volunteer_role_history

      expect(role_history.pluck(:id)).to contain_exactly(team_role.id, board_role.id)
      expect(role_history.find { it[:id] == team_role.id }[:title]).to eq("Member, WCA Results Team")
      expect(role_history.find { it[:id] == board_role.id }[:title]).to eq("Board member, WCA Board of Directors")
    end
  end
end
