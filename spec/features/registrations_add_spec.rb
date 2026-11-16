# frozen_string_literal: true

require "rails_helper"

RSpec.feature "On-the-spot registration events picker", :js do
  let!(:competition) { create(:competition, :registration_open, :visible, :confirmed, :with_delegate, event_ids: %w[222 333]) }

  let(:delegate) { competition.delegates.first }

  before do
    sign_in delegate
    visit competition_registrations_add_path(competition)
  end

  scenario "All checks every event" do
    expect(page).to have_unchecked_field("registration_data[event_ids][]", visible: :all, count: competition.events.count)
    click_button "All"
    expect(page).to have_no_unchecked_field("registration_data[event_ids][]", visible: :all)
  end

  scenario "Clear unchecks every event" do
    check "checkbox-333", allow_label_click: true
    expect(page).to have_checked_field("checkbox-333", visible: :all)
    click_button "Clear"
    expect(page).to have_unchecked_field("registration_data[event_ids][]", visible: :all, count: competition.events.count)
  end
end
