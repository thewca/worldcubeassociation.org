# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Newcomer checks page", :js do
  let!(:competition) { create(:competition, :announced) }

  before do
    sign_in create(:admin)
  end

  scenario "renders the NewcomerChecks React on Rails component" do
    visit competition_newcomer_checks_path(competition)

    # This tab title is rendered by the NewcomerChecks component, so seeing it
    # proves the React on Rails component actually mounted.
    expect(page).to have_text("Duplicate Checker")
  end
end
