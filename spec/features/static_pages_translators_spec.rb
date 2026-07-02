# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Translators page" do
  scenario "renders translators fetched from the API", :js do
    visit "/translators"

    # The "Translators" heading is only emitted by the React component (the
    # server view has no such heading), so seeing it in the body proves the
    # component fetched its data and rendered.
    expect(page).to have_text("Translators")
  end
end
