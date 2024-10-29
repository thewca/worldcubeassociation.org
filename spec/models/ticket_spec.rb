# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ticket, type: :model do
  describe 'user_stakeholders' do
    let(:edit_name_ticket) { FactoryBot.create(:edit_name_ticket) }

    it "user_stakeholders returns nil if user is nil" do
      expect(edit_name_ticket.ticket.user_stakeholders(nil)).to eq([])
    end

    it "user_stakeholders returns WRT stakeholder if user is a WRT member" do
      wrt_member = FactoryBot.create(:wrt_member_role).user
      expect(edit_name_ticket.ticket.user_stakeholders(wrt_member).any? { |stakeholder| stakeholder.stakeholder_id == UserGroup.teams_committees_group_wrt.id }).to eq(true)
    end

    it "user_stakeholders returns nil if user is a normal user" do
      wrt_member = FactoryBot.create(:user)
      expect(edit_name_ticket.ticket.user_stakeholders(wrt_member).any? { |stakeholder| stakeholder.stakeholder_id == UserGroup.teams_committees_group_wrt.id }).to eq(false)
    end
  end
end
