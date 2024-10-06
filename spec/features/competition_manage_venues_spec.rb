# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Competition venues management" do
  before :each do
    # Enable CSRF protection just for these tests.
    # See https://blog.tomoyukikashiro.me/post/test-csrf-in-feature-test-using-capybara/
    allow_any_instance_of(ActionController::Base).to receive(:protect_against_forgery?).and_return(true)
  end

  context "unconfirmed competition without schedule" do
    let!(:competition) { FactoryBot.create(:competition, :with_delegate, :registration_open, event_ids: ["333", "444"], with_rounds: true) }
    background do
      sign_in competition.delegates.first
      visit "/competitions/#{competition.id}/venues/edit"
    end

    scenario "can add a venue and a room", js: true do
      within(:css, "#venues-edit-panel-body") do
        click_button "Add a venue"
        fill_in("venue-name", with: "Venue")
        click_button "Add room"
        fill_in("room-name", with: "Youpitralala")
        within(:css, "div[name='timezone'][role='listbox']>div.menu", visible: :all) do
          # Using a timezone that does not follow Daylight Savings, so that we get consistent results all year round
          find("div", class: "item", text: "Asia/Tokyo (Japan Standard Time, UTC+9)", visible: :all).trigger(:click)
        end
        within(:css, "div[name='countryIso2'][role='combobox']>div.menu[role='listbox']", visible: :all) do
          find("div", class: "item", text: "United States", visible: :all).trigger(:click)
        end
      end

      save_venues_react

      expect(competition.competition_venues.map(&:name)).to match_array %w(Venue)
      expect(competition.competition_venues.flat_map(&:venue_rooms).map(&:name)).to match_array %w(Youpitralala)
    end
  end
end

def save_venues_react
  first(:button, "save your changes!", visible: true).click
  # Wait for ajax to complete.
  expect(page).to have_no_content("You have unsaved changes")
end
