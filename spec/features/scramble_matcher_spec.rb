# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Upload scrambles page", :js do
  let!(:competition) { create(:competition, :announced) }

  before do
    sign_in create(:admin)
  end

  scenario "renders the ScrambleMatcher React on Rails component" do
    visit competition_upload_scrambles_path(competition)

    # The Reset button is rendered unconditionally by the ScrambleMatcher
    # component, so seeing it proves the React on Rails component mounted.
    # It starts out disabled because there are no unsaved changes yet.
    expect(page).to have_button("Reset", disabled: true)
  end
end
