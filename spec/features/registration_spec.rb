# frozen_string_literal: true

require 'rails_helper'

RSpec.feature 'competition results' do
  it 'shows events in correct order' do
    competition = FactoryBot.create(:competition, :registration_open, :visible, events: Event.where(id: %w(222)))
    # Add 333 after 222 in order to give 333 a higher id than 222, in an attempt to break event ordering.
    competition.events = Event.where(id: %w(222 333))

    visit competition_registrations_path(competition)

    table_headers = all('th i')
    expect(table_headers[0][:class]).to include('event-333')
    expect(table_headers[1][:class]).to include('event-222')
  end
end
