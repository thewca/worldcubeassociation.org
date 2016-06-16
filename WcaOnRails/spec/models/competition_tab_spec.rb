require 'rails_helper'

RSpec.describe CompetitionTab, type: :model do
  it "has a valid factory" do
    expect(FactoryGirl.build(:competition_tab)).to be_valid
  end

  it "ensures all attributes are defined as either cloneable or uncloneable" do
    expect(CompetitionTab.column_names).to match_array(CompetitionTab::CLONEABLE_ATTRIBUTES + CompetitionTab::UNCLONEABLE_ATTRIBUTES)
  end
end
