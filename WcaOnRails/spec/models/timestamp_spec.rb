# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Timestamp do
  let(:without_date) { Timestamp.create! name: "without_date" }
  let(:five_hours_ago) { Timestamp.create! name: "five_hours_ago", date: 5.hours.ago }
  let(:two_hours_ago) { Timestamp.create! name: "two_hours_ago", date: 2.hours.ago }

  describe "#not_after?" do
    it "returns true if there is no date recorded yet" do
      expect(without_date.not_after?(3.hours.ago)).to eq true
    end

    it "returns true if the given date is chronologically before the timestamp" do
      expect(five_hours_ago.not_after?(3.hours.ago)).to eq true
    end

    it "returns false if the given date is chronologically after the timestamp" do
      expect(two_hours_ago.not_after?(3.hours.ago)).to eq false
    end
  end
end
