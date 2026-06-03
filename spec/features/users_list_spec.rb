# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Users list page", :js do
  let!(:admin) { create(:admin) }

  scenario "renders the users list React on Rails component" do
    sign_in admin
    # Confirm the login actually took before navigating on: the navbar shows the
    # signed-in user's name.
    expect(page).to have_content(admin.name)

    user = create(:user)
    visit "/users"

    # The UsersList component fetches users from the API and renders each into
    # the table, so the user's name proves it rendered the fetched data.
    expect(page).to have_text(user.name)
  end
end