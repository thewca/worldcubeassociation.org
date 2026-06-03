# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Users list page", :js do
  let!(:admin) { create(:admin) }

  scenario "renders the users list React on Rails component" do
    # `:js` specs use the truncation DB strategy, so this committed row is
    # visible to the Capybara server thread and returned by the users endpoint.
    user = create(:user)

    sign_in admin
    visit "/users"

    # The UsersList component fetches users from the API and renders each into
    # the table, so the user's name proves it rendered the fetched data.
    expect(page).to have_text(user.name)
  end
end
