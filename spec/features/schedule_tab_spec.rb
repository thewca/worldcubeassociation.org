# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Competition schedule tab", :js do
  let!(:competition) { create(:competition, :with_valid_schedule) }

  scenario "renders the Schedule React on Rails component" do
    visit competition_path(competition)

    click_link I18n.t("competitions.show.schedule")

    # This heading is rendered by the Schedule component once a venue timezone is
    # active, so seeing it proves the React on Rails component mounted in the tab.
    expect(page).to have_text(I18n.t("competitions.schedule.time_zone"))
  end
end
