# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LiveResult do
  describe "calculates if live results are complete" do
    let(:competition) { create(:competition, :registration_open, event_ids: %w[333 666]) }
    let(:registration) { create(:registration, :accepted, competition: competition, event_ids: %w[333 666]) }

    it "for rounds with means" do
      round = create(:round, competition: competition, event_id: "666", format_id: 'm')

      complete_mean_result = create(:live_result, :mo3, round: round, registration: registration)
      expect(complete_mean_result.complete?).to be true
    end

    it "if less than 5 attempts are entered for an average of 5 round" do
      round = create(:round, competition: competition, event_id: "333", format_id: 'a')

      incomplete_ao5_result = create(:live_result, :incomplete, round: round, registration: registration)
      expect(incomplete_ao5_result.complete?).to be false
    end
  end
end
