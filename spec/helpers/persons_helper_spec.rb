# frozen_string_literal: true

require "rails_helper"

RSpec.describe PersonsHelper do
  describe "#odd_rank_reason_if_needed" do
    describe "returns the odd message" do
      it "when country rank is missing" do
        rank_single = FactoryBot.create :ranks_single, countryRank: 0
        rank_average = FactoryBot.create :ranks_average
        expect(odd_rank_reason_needed?(rank_single, rank_average)).to eq true
      end

      it "when continent rank is missing" do
        rank_single = FactoryBot.create :ranks_single
        rank_average = FactoryBot.create :ranks_average, continentRank: 0
        expect(odd_rank_reason_needed?(rank_single, rank_average)).to eq true
      end

      it "when country rank is greater than continent rank" do
        rank_single = FactoryBot.create :ranks_single, continentRank: 10, countryRank: 1
        rank_average = FactoryBot.create :ranks_single, continentRank: 10, countryRank: 50
        expect(odd_rank_reason_needed?(rank_single, rank_average)).to eq true
      end
    end
  end
end
