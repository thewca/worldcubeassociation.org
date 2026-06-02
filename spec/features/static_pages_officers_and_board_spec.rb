# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Officers and board page" do
  scenario "renders officers fetched from the API", :js do
    visit "/officers-and-board"

    # Description paragraph rendered by the OfficersAndBoard component once the
    # officer/board roles load from the API.
    expect(page).to have_text(I18n.t("page.officers_and_board.officers_description"))
  end
end