# frozen_string_literal: true

require "rails_helper"

RSpec.describe ResultsHelper do
  describe "#historical_pb_markers" do
    let(:person) { FactoryGirl.create :person }

    it "returns a hash indicating which of the results given in the chronological order were PBs" do
      results = []
      results << FactoryGirl.create(:result, person: person, best: 1000, average: 1200)
      results << FactoryGirl.create(:result, person: person, best: 900, average: 1300)
      results << FactoryGirl.create(:result, person: person, best: 890, average: 950)
      results << FactoryGirl.create(:result, person: person, best: 490, average: 990)
      results << FactoryGirl.create(:result, person: person, best: 870, average: 960)

      pb_markers = helper.historical_pb_markers results
      expect(pb_markers).to eq(
        results[0].id => { single: true, average: true },
        results[1].id => { single: true },
        results[2].id => { single: true, average: true },
        results[3].id => { single: true },
      )
    end

    it "marks tie as PB" do
      results = []
      results << FactoryGirl.create(:result, person: person, best: 1000, average: 1200)
      results << FactoryGirl.create(:result, person: person, best: 1000, average: 1300)

      pb_markers = helper.historical_pb_markers results
      expect(pb_markers[results[1].id][:single]).to eq true
    end

    it "doesn't mark uncompleted solves as PB" do
      combined_final = RoundType.find("c")
      results = []
      results << FactoryGirl.create(:result, person: person, best: SolveTime::DNF_VALUE, average: SolveTime::SKIPPED_VALUE, round_type: combined_final)
      results << FactoryGirl.create(:result, person: person, best: SolveTime::DNS_VALUE, average: SolveTime::SKIPPED_VALUE, round_type: combined_final)

      pb_markers = helper.historical_pb_markers results
      expect(pb_markers).to eq({})
    end
  end
end
