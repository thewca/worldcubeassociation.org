# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Search widget", :js do
  scenario "renders the SearchWidget React on Rails component in the navigation" do
    visit root_path

    # The Rails view only renders the empty #omnisearch-form mount point; the
    # input inside it comes from the SearchWidget component, so finding it
    # proves the React on Rails component actually mounted.
    expect(page).to have_css("#omnisearch-form input[placeholder='#{I18n.t('common.search_site')}']", visible: :all)
  end
end
