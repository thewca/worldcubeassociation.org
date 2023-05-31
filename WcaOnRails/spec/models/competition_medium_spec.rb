# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompetitionMedium do
  it "defines a valid medium" do
    medium = FactoryBot.build :competition_medium
    expect(medium).to be_valid
  end

  it "validates competition_id" do
    medium = FactoryBot.build :competition_medium, competition_id: "foo"
    expect(medium).to be_invalid_with_errors(competition: ["must exist"])
  end

  it "validates type" do
    medium = FactoryBot.build :competition_medium, media_type: ""
    expect(medium).to be_invalid_with_errors(media_type: ["can't be blank"])
  end

  it "validates status" do
    medium = FactoryBot.build :competition_medium, status: ""
    expect(medium).to be_invalid_with_errors(status: ["can't be blank"])
  end
end
