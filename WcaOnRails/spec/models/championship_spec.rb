# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Championship do
  let!(:competition) { FactoryGirl.create :competition }

  describe "validations" do
    it "cannot create two same championship types to the one competition" do
      competition.championships.create! championship_type: "world"
      championship_duplicate = competition.championships.build championship_type: "world"
      expect(championship_duplicate).to be_invalid_with_errors(championship_type: ["has already been taken"])
    end

    it "cannot create a championship of an invalid type" do
      championship = competition.championships.build championship_type: "mars"
      expect(championship).to be_invalid_with_errors(championship_type: ["is not included in the list"])
    end
  end

  describe "name" do
    it "returns the name associated to the championship_type" do
      championship = Championship.new(championship_type: "world")
      expect(championship.name).to eq "World Championship"

      championship = Championship.new(championship_type: "_Europe")
      expect(championship.name).to eq "Continental Championship for Europe"

      championship = Championship.new(championship_type: "greater_china")
      expect(championship.name).to eq "Greater China Championship"

      championship = Championship.new(championship_type: "ES")
      expect(championship.name).to eq "National Championship for Spain"
    end
  end
end
