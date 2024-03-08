# frozen_string_literal: true

require 'rails_helper'

RSpec.feature 'Set the locale' do
  scenario 'visiting the home page while not signed in and changing the locale', js: true do
    # Our navigation hide the language name on small resolutions, make sure we
    # use one wide enough.
    page.driver.resize(1280, 1024)
    visit '/#foo'
    expect(page).to have_content 'English'
    expect(page).not_to have_content 'Français'

    click_on 'English' # Activate the locale selection dropdown.
    click_on 'Français'

    expect(page.current_path).to eq '/'
    expect(URI.parse(page.current_url).fragment).to eq 'foo'

    expect(page).not_to have_content 'English'
    expect(page).to have_content 'Français'
  end

  scenario 'signing in updates to the preferred_locale', js: true do
    page.driver.resize(1280, 1024)
    visit '/'
    expect(page).to have_content 'English'
    expect(page).not_to have_content 'Français'

    user = FactoryBot.create :user, preferred_locale: 'fr'
    sign_in user
    visit '/'

    expect(page).not_to have_content 'English'
    expect(page).to have_content 'Français'
  end
end
