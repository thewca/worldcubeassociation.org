# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Competition events tab", :js do
  let!(:competition) { create(:competition, :visible, with_rounds: true) }

  scenario "renders the EventsTable React on Rails component" do
    visit competition_path(competition)

    click_link I18n.t("competitions.show.events")

    # This column header is rendered by the EventsTable component, so seeing it
    # proves the React on Rails component actually mounted in the events tab.
    expect(page).to have_text(I18n.t("competitions.events.time_limit"))
  end
end
