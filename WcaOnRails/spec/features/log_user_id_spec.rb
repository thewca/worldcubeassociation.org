require "rails_helper"

RSpec.feature "edit user" do
  context "editing own profile" do
    let(:admin) { FactoryGirl.create :admin, :wca_id }

    before :each do
      sign_in admin
    end

    it "can clear wca id" do
      visit profile_edit_path
      fill_in "WCA ID", with: ""
      click_button "Save"

      fill_in "Current password", with: "wca"
      click_button "Confirm"
      expect(page.status_code).to eq 200
      expect(admin.reload.wca_id).to eq nil
    end
  end
end
