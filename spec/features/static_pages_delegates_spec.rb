# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Delegates page" do
  scenario "renders delegate regions fetched from the API", :js do
    visit "/delegates"

    # The "Regions" heading is rendered by the component once the delegate-region
    # groups load from the API (the server view emits no such heading).
    expect(page).to have_text("Regions")
  end
end
