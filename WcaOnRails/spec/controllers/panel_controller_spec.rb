# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PanelController do
  describe "signed in as senior delegate" do
    let!(:senior_delegate) { FactoryBot.create :senior_delegate }
    before :each do
      sign_in senior_delegate
    end

    it "can view the pending claims for subordinate delegates" do
      get :pending_claims_for_subordinate_delegates
      expect(response.status).to eq 200
    end

    it "can't view the seniors list" do
      get :seniors
      expect(response).to redirect_to root_path
    end
  end

  describe "signed in as board member" do
    let!(:board_member) { FactoryBot.create :user, :board_member }
    before :each do
      sign_in board_member
    end

    it "can view the seniors list" do
      get :seniors
      expect(response.status).to eq 200
    end

    it "can view the pending claims for subordinate delegates of senior delegates" do
      get :pending_claims_for_subordinate_delegates
      expect(response.status).to eq 200
    end
  end
end
