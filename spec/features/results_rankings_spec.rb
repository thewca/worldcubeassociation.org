# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Results rankings page" do
  scenario "renders the rankings React on Rails component", :js do
    visit "/results/rankings/333/single"

    # The "by region" show option is rendered by the ResultsFilter that the
    # ResultsRankings component mounts.
    expect(page).to have_text(I18n.t("results.selector_elements.show_selector.by_region"))
  end
end
