require 'rails_helper'

RSpec.describe CompetitionTab, type: :model do
  it "has a valid factory" do
    expect(FactoryGirl.build(:competition_tab)).to be_valid
  end
end
