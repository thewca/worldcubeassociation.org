# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PanelController do
  describe "signed in as senior delegate" do
    let!(:senior_delegate_role) { create :senior_delegate_role }

    before :each do
      sign_in senior_delegate_role.user
    end

    it "can view the pending claims for subordinate delegates" do
      get :pending_claims_for_subordinate_delegates
      expect(response).to have_http_status :ok
    end
  end

  describe "signed in as board member" do
    let!(:board_member) { create :user, :board_member }

    before :each do
      sign_in board_member
    end

    it "can view the pending claims for subordinate delegates of senior delegates" do
      get :pending_claims_for_subordinate_delegates
      expect(response).to have_http_status :ok
    end
  end
end
