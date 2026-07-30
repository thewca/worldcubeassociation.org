# frozen_string_literal: true

require "rails_helper"

RSpec.feature "User roles tab", :js do
  let!(:user) { create(:user) }

  before do
    sign_in create(:admin)
  end

  scenario "renders the RolesTab React on Rails component" do
    visit edit_user_path(user, section: "roles")

    # A user without any roles gets this message from the RolesTab component,
    # so seeing it proves the React on Rails component actually mounted.
    expect(page).to have_text("No Roles...")
  end
end
