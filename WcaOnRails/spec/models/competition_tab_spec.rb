require 'rails_helper'

RSpec.describe CompetitionTab, type: :model do
  it "has a valid factory" do
    expect(FactoryGirl.build(:competition_tab)).to be_valid
  end

  it "ensures all attributes are defined as either cloneable or uncloneable" do
    expect(CompetitionTab.column_names).to match_array(CompetitionTab::CLONEABLE_ATTRIBUTES + CompetitionTab::UNCLONEABLE_ATTRIBUTES)
  end

  context "display_order" do
    let(:competition) { FactoryGirl.create(:competition) }
    let(:other_competition) { FactoryGirl.create(:competition) }

    it "increases by one for new created tabs" do
      FactoryGirl.create_list(:competition_tab, 3, competition: competition)
      expect(competition.competition_tabs.pluck(:display_order)).to eq [1, 2, 3]
    end

    it "starts from 1 for each competition" do
      2.times do
        FactoryGirl.create(:competition_tab, competition: competition)
        FactoryGirl.create(:competition_tab, competition: other_competition)
      end
      expect(competition.competition_tabs.pluck(:display_order)).to eq [1, 2]
      expect(other_competition.competition_tabs.pluck(:display_order)).to eq [1, 2]
    end

    it "are updated correctly after a tab is deleted" do
      FactoryGirl.create_list(:competition_tab, 5, competition: competition)
      competition.competition_tabs.second.destroy
      expect(competition.competition_tabs.pluck(:display_order)).to eq [1, 2, 3, 4]
      competition.competition_tabs.first.destroy
      expect(competition.competition_tabs.pluck(:display_order)).to eq [1, 2, 3]
      competition.competition_tabs.last.destroy
      expect(competition.competition_tabs.pluck(:display_order)).to eq [1, 2]
    end
  end
end
