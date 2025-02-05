# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LiveResult do
  describe "calculates if live results are complete" do
    it "for rounds with means" do
      complete_mean_result = FactoryBot.create(:live_result, :mo3)
      expect(complete_mean_result.complete?).to eq true
    end

    it "if less than 5 attempts are entered for an average of 5 round" do
      incomplete_ao5_result = FactoryBot.create(:live_result, :incomplete)
      expect(incomplete_ao5_result.complete?).to eq false
    end
  end
end
