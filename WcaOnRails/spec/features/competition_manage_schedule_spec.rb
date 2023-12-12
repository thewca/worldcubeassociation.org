# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Competition events management" do
  before :each do
    # Enable CSRF protection just for these tests.
    # See https://blog.tomoyukikashiro.me/post/test-csrf-in-feature-test-using-capybara/
    allow_any_instance_of(ActionController::Base).to receive(:protect_against_forgery?).and_return(true)
  end

  context "unconfirmed competition without schedule" do
    let!(:competition) { FactoryBot.create(:competition, :with_delegate, :registration_open, event_ids: ["333", "444"], with_rounds: true) }
    background do
      sign_in competition.delegates.first
      visit "/competitions/#{competition.id}/schedule/edit"
    end

    scenario "can add a venue and a room", js: true do
      find("div", class: 'title', text: 'Edit venues information').click

      within(:css, "#venues-edit-panel-body") do
        click_button "Add a venue"
        fill_in("venue-name", with: "Venue")
        click_button "Add room"
        fill_in("room-name", with: "Youpitralala")
        within(:css, "div[name='timezone'][role='listbox']>div.menu", visible: :all) do
          find("div", class: "item", text: "Pacific Time (US & Canada)", visible: :all).trigger(:click)
        end
        within(:css, "div[name='countryIso2'][role='combobox']>div.menu[role='listbox']", visible: :all) do
          find("div", class: "item", text: "United States", visible: :all).trigger(:click)
        end
      end

      save_schedule_react

      expect(competition.competition_venues.map(&:name)).to match_array %w(Venue)
      expect(competition.competition_venues.flat_map(&:venue_rooms).map(&:name)).to match_array %w(Youpitralala)
    end
  end

  context "unconfirmed competition with schedule" do
    let!(:competition) { FactoryBot.create(:competition, :with_delegate, :registration_open, :with_valid_schedule, event_ids: ["333", "444"]) }
    background do
      sign_in competition.delegates.first
      visit "/competitions/#{competition.id}/schedule/edit"
    end

    scenario "room calendar is rendered", js: true do
      find("div", class: 'title', text: 'Edit schedules').click

      within(:css, "#schedules-edit-panel-body") do
        # click_link doesn't work because Capybara expects links to always have an href
        find("a", class: 'item', text: "Room 1 for venue 1").click
        # 2 is the number of non-nested activities created by the factory
        # Nested activity are not supported (yet) in the schedule manager
        expect(all('.fc-event').size).to eq(2)
      end
    end
  end
end

def save_schedule_react
  first(:button, "save your changes!", visible: true).click
  # Wait for ajax to complete.
  expect(page).to have_no_content("You have unsaved changes")
end
