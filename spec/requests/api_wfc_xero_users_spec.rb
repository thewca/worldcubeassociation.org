# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API WFC Xero users" do
  describe "PUT /api/v0/wfc/xero_users/:id" do
    let!(:xero_user) { WfcXeroUser.create!(name: "Dues Payer", email: "payer@example.com", is_combined_invoice: false) }
    let(:update_params) { { name: "Attacker", email: "attacker@example.com", is_combined_invoice: true } }

    it "rejects a signed-out request" do
      put api_v0_wfc_xero_user_path(xero_user), params: update_params

      expect(response).to have_http_status(:unauthorized)
      expect(xero_user.reload.email).to eq "payer@example.com"
    end

    it "rejects a regular user" do
      sign_in create(:user)

      put api_v0_wfc_xero_user_path(xero_user), params: update_params

      expect(response).to have_http_status(:unauthorized)
      expect(xero_user.reload.email).to eq "payer@example.com"
    end

    it "updates the Xero user for a WFC member" do
      sign_in create(:user, :wfc_member)

      put api_v0_wfc_xero_user_path(xero_user), params: update_params

      expect(response).to be_successful
      expect(xero_user.reload.email).to eq "attacker@example.com"
    end
  end
end
