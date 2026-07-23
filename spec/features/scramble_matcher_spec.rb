# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Upload scrambles page", :js do
  let!(:competition) { create(:competition) }

  before do
    sign_in create(:admin)
  end

  scenario "renders the ScrambleMatcher React on Rails component" do
    visit upload_scrambles_path(competition)

    # The Reset button is rendered unconditionally by the ScrambleMatcher
    # component, so seeing it proves the React on Rails component mounted.
    expect(page).to have_button("Reset")
  end
end
