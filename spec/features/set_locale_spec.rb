# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Set the locale" do
  scenario "visiting the home page while not signed in and changing the locale", :js do
    # Our navigation hide the language name on small resolutions, make sure we
    # use one wide enough.
    page.driver.resize_window_to(page.driver.current_window_handle, 1280, 1024)
    visit "/#foo"
    expect(page).to have_text "English"
    expect(page).to have_no_text "Français"

    click_on "English" # Activate the locale selection dropdown.
    click_on "Français"

    expect(page).to have_current_path "/", ignore_query: true
    expect(URI.parse(page.current_url).fragment).to eq "foo"

    expect(page).to have_no_text "English"
    expect(page).to have_text "Français"
  end

  scenario "signing in updates to the preferred_locale", :js do
    page.driver.resize_window_to(page.driver.current_window_handle, 1280, 1024)
    visit "/"
    expect(page).to have_text "English"
    expect(page).to have_no_text "Français"

    user = create(:user, preferred_locale: "fr")
    sign_in user
    visit "/"

    expect(page).to have_text "Français"
    expect(page).to have_no_text "English"
  end
end
