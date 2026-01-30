# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Live::Helper do
  let(:competition) { create(:competition, event_ids: ["333"]) }
  let(:registrations) { create_list(:registration, 5, :accepted, competition: competition, event_ids: ["333"]) }

  context "Round Diff" do
    let(:round) { create(:round, event_id: "333") }

    it 'broadcasts diff to ActionCable' do
      # TODO move this test to use the open round and then update approach after that PR is merged
      registration_1 = registrations.first
      expect {
        create(:live_result, registration_id: registration_1.id, round: round)
      }.to have_broadcasted_to(WcaLive.broadcast_key(round.id))
             .from_channel(ApplicationCable::Channel)
    end
  end
end
