# frozen_string_literal: true

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
      within("#general") { click_button "Save" }

      expect(admin.reload.wca_id).to eq nil
    end
  end
end
