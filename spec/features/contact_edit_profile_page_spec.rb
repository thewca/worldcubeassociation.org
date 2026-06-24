# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Contact edit profile page", :js do
  scenario "renders the edit profile React on Rails component for a logged-out visitor" do
    visit "/contact/edit_profile"

    # When no user is logged in, the ContactEditProfilePage component renders this
    # error message, so seeing it proves the React component actually rendered.
    expect(page).to have_text("Please log in to edit your profile")
  end
end
