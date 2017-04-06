# frozen_string_literal: true
require 'rails_helper'

RSpec.describe Round do
  it "defines a valid Round" do
    round = FactoryGirl.build :round
    expect(round).to be_valid
  end

  context "format" do
    it "allows average of 5 for 333" do
      round = FactoryGirl.build :round, event_id: "333", format_id: "a"
      expect(round).to be_valid
    end

    it "rejects mean of 3 for 333" do
      round = FactoryGirl.build :round, event_id: "333", format_id: "m"
      expect(round).to be_invalid_with_errors(format: ["'m' is not allowed for '333'"])
    end
  end
end
