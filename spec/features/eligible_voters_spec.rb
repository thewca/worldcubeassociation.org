# frozen_string_literal: true

require "rails_helper"
require "csv"

RSpec.feature "Eligible voters csv" do
  before { Timecop.freeze(Time.utc(2016, 5, 5, 10, 5, 3)) }
  after { Timecop.return }

  let!(:user) { FactoryBot.create(:user) }
  let!(:former_team_leader) { FactoryBot.create(:user, :wrc_leader, end_date: 1.day.ago) }
  let!(:team_leader) { FactoryBot.create(:user, :wrt_leader) }
  let!(:wac_leader) { FactoryBot.create(:wac_role_leader) }
  let!(:team_senior_member) { FactoryBot.create(:user, :wrc_senior_member) }
  let!(:team_member) { FactoryBot.create(:user, :wrc_member) }
  let!(:senior_delegate_role) { FactoryBot.create(:senior_delegate_role) }
  let!(:junior_delegate) { FactoryBot.create(:junior_delegate_role, group_id: senior_delegate_role.group_id) }
  let!(:delegate) { FactoryBot.create(:delegate_role, group_id: senior_delegate_role.group.id).user }
  let!(:delegate_who_is_also_team_leader) { FactoryBot.create(:delegate, :wrc_leader) }
  let!(:board_member) { FactoryBot.create(:user, :board_member) }
  let!(:officer) { FactoryBot.create(:secretary_role) }

  before :each do
    sign_in board_member
  end

  # See https://github.com/rails/rails/pull/33829 to find about the crazy UTF-8 mangled filenames in Content-Disposition
  # (Spoiler: This is actually proper RFC that has been implemented only in Rails 6. Looks ugly but for browsers it's a good feature!)

  describe "all voters" do
    it 'includes all voters' do
      visit "/admin/all-voters.csv"

      expect(page.response_headers['Content-Disposition']).to eq 'attachment; filename="all-wca-voters-2016-05-05T10%3A05%3A03Z.csv"; filename*=UTF-8\'\'all-wca-voters-2016-05-05T10%3A05%3A03Z.csv'
      expect(CSV.parse(page.body)).to match_array [
        ["password", team_leader.id.to_s, team_leader.email, team_leader.name],
        ["password", team_senior_member.id.to_s, team_senior_member.email, team_senior_member.name],
        ["password", delegate.id.to_s, delegate.email, delegate.name],
        ["password", delegate_who_is_also_team_leader.id.to_s, delegate_who_is_also_team_leader.email, delegate_who_is_also_team_leader.name],
        ["password", senior_delegate_role.user.id.to_s, senior_delegate_role.user.email, senior_delegate_role.user.name],
        ["password", board_member.id.to_s, board_member.email, board_member.name],
        ["password", officer.user.id.to_s, officer.user.email, officer.user.name],
      ]
    end
  end

  describe "leader senior voters" do
    it "includes team leaders and senior delegates only" do
      visit "/admin/leader-senior-voters.csv"

      expect(page.response_headers['Content-Disposition']).to eq 'attachment; filename="leader-senior-wca-voters-2016-05-05T10%3A05%3A03Z.csv"; filename*=UTF-8\'\'leader-senior-wca-voters-2016-05-05T10%3A05%3A03Z.csv'
      expect(CSV.parse(page.body)).to match_array [
        ["password", team_leader.id.to_s, team_leader.email, team_leader.name],
        ["password", delegate_who_is_also_team_leader.id.to_s, delegate_who_is_also_team_leader.email, delegate_who_is_also_team_leader.name],
        ["password", senior_delegate_role.user.id.to_s, senior_delegate_role.user.email, senior_delegate_role.user.name],
      ]
      # "password" does not refer to actual passwords. They are related to a voter type that must be specified
    end
  end
end
