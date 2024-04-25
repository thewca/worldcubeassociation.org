# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompetitionSeries do
  let!(:series) { FactoryBot.create :competition_series }
  let!(:competition) { FactoryBot.create :competition, competition_series: series }

  describe "validations" do
    it "cannot create two series with the same ID" do
      series_duplicate = FactoryBot.build :competition_series, wcif_id: series.wcif_id
      expect(series_duplicate).to be_invalid_with_errors(wcif_id: ["has already been taken"])
    end
  end

  it "correctly handles duplicates" do
    series.competitions = [competition, competition]
    expect(series.reload.competitions.count).to eq 1
  end

  it "does not delete the competition upon deleting the association" do
    other_competition = FactoryBot.create(:competition)
    series.competition_ids = [other_competition]

    previous_competition_id = competition.id
    competition.reload

    expect(competition.id).to eq previous_competition_id
    expect(competition.destroyed?).to eq false
  end

  it "deletes the series when it is orphaned" do
    competition.competition_series_id = nil
    competition.save!

    expect { series.reload }.to raise_error(ActiveRecord::RecordNotFound)
  end

  it "does not delete the competition upon deleting the entire series" do
    series.destroy

    previous_competition_id = competition.id
    competition.reload

    expect(competition.id).to eq previous_competition_id
    expect(competition.destroyed?).to eq false
  end
end
