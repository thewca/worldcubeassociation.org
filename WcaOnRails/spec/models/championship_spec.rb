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
  end
end
