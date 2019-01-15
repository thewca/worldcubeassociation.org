# frozen_string_literal: true

RSpec.describe "monkey patches" do
  context "Date#safe_parse" do
    it "parses valid dates" do
      expect(Date.safe_parse("2018-04-03")).to eq Date.new(2018, 4, 3)
    end

    it "returns nil for invalid dates" do
      expect(Date.safe_parse("this is not a date")).to eq nil
      expect(Date.safe_parse("2018-1-3")).to eq nil
    end

    it "matches entire string" do
      expect(Date.safe_parse("before 2018-01-03 after")).to eq nil
    end
  end
end
