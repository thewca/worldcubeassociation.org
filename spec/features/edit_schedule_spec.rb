# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Edit schedule page", :js do
  let!(:competition) { create(:competition) }

  before do
    sign_in create(:admin)
  end

  scenario "renders the EditSchedule React on Rails component" do
    visit edit_schedule_path(competition)

    # This accordion title is rendered directly by the EditSchedule component,
    # so seeing it proves the React on Rails component actually mounted.
    expect(page).to have_text("Edit venues information")
  end
end
