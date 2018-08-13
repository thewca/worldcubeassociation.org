# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Competition events management" do
  before :each do
    # Enable CSRF protection just for these tests.
    # See https://blog.tomoyukikashiro.me/post/test-csrf-in-feature-test-using-capybara/
    allow_any_instance_of(ActionController::Base).to receive(:protect_against_forgery?).and_return(true)
  end

  context "unconfirmed competition without schedule" do
    let(:competition) { FactoryBot.create(:competition, :with_delegate, :registration_open, :with_rounds, event_ids: ["333", "444"]) }
    background do
      sign_in competition.delegates.first
      visit "/competitions/#{competition.id}/schedule/edit"
    end

    scenario "can add a venue and a room", js: true do
      click_link "Add a venue"
      fill_in with: "Venue", class: "venue-name-input"
      click_on "Add room"
      fill_in with: "Youpitralala", class: "room-name-input"
      save
      expect(competition.competition_venues.map(&:name)).to match_array %w(Venue)
      expect(competition.competition_venues.flat_map(&:venue_rooms).map(&:name)).to match_array %w(Youpitralala)
    end
  end

  context "unconfirmed competition with schedule" do
    let(:competition) { FactoryBot.create(:competition, :with_delegate, :registration_open, :with_rounds, event_ids: ["333", "444"], with_schedule: true) }
    background do
      sign_in competition.delegates.first
      visit "/competitions/#{competition.id}/schedule/edit"
    end

    scenario "room calendar is rendered", js: true do
      within(:css, "#schedules-edit-panel-body") do
        select('"Room 1 for venue 1" in "Venue 1"', from: 'venue-room-selector')
        # 2 is the number of non-nested activities created by the factory
        # Nested activity are not supported (yet) in the schedule manager
        expect(all('.fc-event').size).to eq(2)
      end
    end
  end
end

def save
  # Trigger click directly on the element ignoring any modals.
  first(:button, "save your changes!", visible: true).trigger('click')
  # Wait for ajax to complete.
  expect(page).to have_no_content("You have unsaved changes")
end
