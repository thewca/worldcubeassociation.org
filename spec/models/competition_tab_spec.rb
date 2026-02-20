# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompetitionTab do
  it "has a valid factory" do
    expect(build(:competition_tab)).to be_valid
  end

  it "ensures all attributes are defined as either cloneable or uncloneable" do
    expect(CompetitionTab.column_names).to match_array(CompetitionTab::CLONEABLE_ATTRIBUTES + CompetitionTab::UNCLONEABLE_ATTRIBUTES)
  end

  describe "#slug" do
    it "generates the same slug under different locales" do
      competition_tab = build(:competition_tab, id: 42, name: "Schedule / Расписание")
      expect(I18n.with_locale(:en) { competition_tab.slug }).to eq "42-schedule"
      expect(I18n.with_locale(:ru) { competition_tab.slug }).to eq "42-schedule"
    end
  end

  describe "#display_order" do
    let(:competition) { create(:competition) }
    let(:other_competition) { create(:competition) }

    it "increases by one for new created tabs" do
      create_list(:competition_tab, 3, competition: competition)
      expect(competition.tabs.pluck(:display_order)).to eq [1, 2, 3]
    end

    it "starts from 1 for each competition" do
      2.times do
        create(:competition_tab, competition: competition)
        create(:competition_tab, competition: other_competition)
      end
      expect(competition.tabs.pluck(:display_order)).to eq [1, 2]
      expect(other_competition.tabs.pluck(:display_order)).to eq [1, 2]
    end

    it "are updated correctly after a tab is deleted" do
      create_list(:competition_tab, 5, competition: competition)
      competition.tabs.second.destroy
      expect(competition.tabs.pluck(:display_order)).to eq [1, 2, 3, 4]
      competition.tabs.first.destroy
      expect(competition.tabs.pluck(:display_order)).to eq [1, 2, 3]
      competition.tabs.last.destroy
      expect(competition.tabs.pluck(:display_order)).to eq [1, 2]
    end
  end

  describe "#reorder" do
    let!(:competition) { create(:competition) }
    let!(:tab1) { create(:competition_tab, competition: competition) }
    let!(:tab2) { create(:competition_tab, competition: competition) }
    let!(:tab3) { create(:competition_tab, competition: competition) }

    it "can swap tab with its predecessor" do
      tab2.reorder("up")
      expect(competition.tabs.to_a).to eq [tab2, tab1, tab3]
    end

    it "can swap tab with its successor" do
      tab2.reorder("down")
      expect(competition.tabs.to_a).to eq [tab1, tab3, tab2]
    end

    it "doesn't change anything when swapping first tab with its predecessor" do
      tab1.reorder("up")
      expect(competition.tabs.to_a).to eq [tab1, tab2, tab3]
    end

    it "doesn't change anything when swapping last tab with its successor" do
      tab3.reorder("down")
      expect(competition.tabs.to_a).to eq [tab1, tab2, tab3]
    end
  end

  describe "#verify_if_full_urls" do
    let(:competition_tab) { build(:competition_tab) }

    it "doesn't allow relative URLs" do
      competition_tab.update(content: "[Link](/relative)")
      expect(competition_tab).not_to be_valid
    end

    it "allows full URLs" do
      competition_tab.update(content: "[Link](http://full)")
      expect(competition_tab).to be_valid
    end

    it "allows anchors to static competition tabs" do
      competition_tab.update(content: "For general info, click [here](#general-info)")
      expect(competition_tab).to be_valid
    end

    it "does not allow anchors to something that looks like a static tab but isn't" do
      competition_tab.update(content: "For general info, click [here](#general-info-with-injection-payload)")
      expect(competition_tab).not_to be_valid
    end

    it "does not allow anchors to custom tabs" do
      competition_tab.update(content: "For accommodation around the venue, click [here](#12345-accommodation)")
      expect(competition_tab).not_to be_valid
    end
  end
end
