# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Search widget", :js do
  scenario "renders the SearchWidget React on Rails component in the navigation" do
    visit root_path

    # The Rails view only renders the empty #omnisearch-form mount point; the
    # dropdown inside it comes from the SearchWidget component, so finding it
    # proves the React on Rails component actually mounted. The id itself has to
    # be passed as react_on_rails' own :id option, because the gem overwrites
    # any id given in html_options with its generated dom_id.
    expect(page).to have_css("#omnisearch-form .multisearch-dropdown")
    expect(page).to have_text(I18n.t('common.search_site'))
  end
end
