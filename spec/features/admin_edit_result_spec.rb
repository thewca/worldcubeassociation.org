# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Admin edit result page", :js do
  let!(:result) { create(:result) }

  before do
    sign_in create(:admin)
  end

  scenario "renders the EditResult React on Rails component" do
    visit edit_result_path(result)

    # This heading is rendered by the EditEntry component that EditResult wraps,
    # so seeing it proves the React on Rails component actually mounted.
    expect(page).to have_text("Result previously saved in the database")
  end
end
