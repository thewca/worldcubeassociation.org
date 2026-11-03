# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API WFC dues redirects" do
  describe "DELETE /api/v0/wfc/dues_redirects/:id" do
    let(:xero_user) { WfcXeroUser.create!(name: "Dues Payer", email: "payer@example.com", is_combined_invoice: false) }
    let!(:dues_redirect) { WfcDuesRedirect.create!(redirect_source: Country.c_find_by_iso2("US"), redirect_to: xero_user) }

    it "rejects a signed-out request" do
      delete api_v0_wfc_dues_redirect_path(dues_redirect)

      expect(response).to have_http_status(:unauthorized)
      expect(WfcDuesRedirect.exists?(dues_redirect.id)).to be true
    end

    it "rejects a regular user" do
      sign_in create(:user)

      delete api_v0_wfc_dues_redirect_path(dues_redirect)

      expect(response).to have_http_status(:unauthorized)
      expect(WfcDuesRedirect.exists?(dues_redirect.id)).to be true
    end

    it "deletes the dues redirect for a WFC member" do
      sign_in create(:user, :wfc_member)

      delete api_v0_wfc_dues_redirect_path(dues_redirect)

      expect(response).to be_successful
      expect(WfcDuesRedirect.exists?(dues_redirect.id)).to be false
    end
  end
end
