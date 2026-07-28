# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Search widget", :js do
  scenario "renders the SearchWidget React on Rails component in the navigation" do
    visit root_path

    # The Rails view only renders the empty #omnisearch-form mount point; the
    # dropdown inside it comes from the SearchWidget component, so finding it
    # proves the React on Rails component actually mounted.
    # Semantic UI renders a Dropdown's `placeholder` as its text div, not as a
    # `placeholder` attribute on the search input.
    expect(page).to have_css(
      "#omnisearch-form .multisearch-dropdown div.text",
      text: I18n.t('common.search_site'),
      visible: :all,
    )
  end
end
