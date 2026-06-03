# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Results records page" do
  scenario "renders the records React on Rails component", :js do
    visit "/results/records"

    # The "separate" show option is rendered by the ResultsFilter that the
    # ResultsRecords component mounts.
    expect(page).to have_text(I18n.t("results.selector_elements.show_selector.separate"))
  end
end