# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Contact page", :js do
  scenario "renders the contact form React on Rails component" do
    visit "/contact"

    # This note is rendered inside the ContactsPage component's Message (it is not
    # part of the page layout), so seeing it proves the React component rendered.
    expect(page).to have_text("Before making an inquiry")
  end
end
