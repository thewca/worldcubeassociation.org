# frozen_string_literal: true

require 'rails_helper'
require 'auxiliary_data_computation'

RSpec.describe "AuxiliaryDataComputation" do
  describe ".compute_concise_results", clean_db_with_truncation: true do
    let(:person) { FactoryBot.create :person, countryId: "China" }
    let(:competition_2016) { FactoryBot.create :competition, starts: Date.parse("2016-04-04") }
    let(:next_competition_2016) { FactoryBot.create :competition, starts: Date.parse("2016-07-07") }
    let(:competition_2017) { FactoryBot.create :competition, starts: Date.parse("2017-08-08") }

    it "creates tables containing best results data for each person per event per year" do
      FactoryBot.create :result, eventId: "333", best: 700, average: 800, competition: competition_2016, person: person
      FactoryBot.create :result, eventId: "333", best: 750, average: 850, competition: competition_2016, person: person
      FactoryBot.create :result, eventId: "333", best: 800, average: 900, competition: competition_2017, person: person
      FactoryBot.create :result, eventId: "222", best: 100, average: 150, competition: competition_2017, person: person
      AuxiliaryDataComputation.compute_concise_results
      # Concise single results
      concise_single_results = ActiveRecord::Base.connection.execute "SELECT eventId, personId, year, best FROM ConciseSingleResults"
      expect(concise_single_results).to match_array [
        ["333", person.wca_id, 2016, 700],
        ["333", person.wca_id, 2017, 800],
        ["222", person.wca_id, 2017, 100],
      ]
      # Concise average results
      concise_average_results = ActiveRecord::Base.connection.execute "SELECT eventId, personId, year, average FROM ConciseAverageResults"
      expect(concise_average_results).to match_array [
        ["333", person.wca_id, 2016, 800],
        ["333", person.wca_id, 2017, 900],
        ["222", person.wca_id, 2017, 150],
      ]
    end

    it "creates multiple entries for people that have switched country in the middle of a year" do
      FactoryBot.create :result, eventId: "333", best: 700, average: 800, competition: competition_2016, person: person
      person.update_using_sub_id! countryId: "Chile"
      FactoryBot.create :result, eventId: "333", best: 750, average: 850, competition: next_competition_2016, person: person
      AuxiliaryDataComputation.compute_concise_results
      # Concise single results
      concise_single_results = ActiveRecord::Base.connection.execute "SELECT eventId, personId, countryId, year, best FROM ConciseSingleResults"
      expect(concise_single_results).to match_array [
        ["333", person.wca_id, "China", 2016, 700],
        ["333", person.wca_id, "Chile", 2016, 750],
      ]
      # Concise average results
      concise_average_results = ActiveRecord::Base.connection.execute "SELECT eventId, personId, countryId, year, average FROM ConciseAverageResults"
      expect(concise_average_results).to match_array [
        ["333", person.wca_id, "China", 2016, 800],
        ["333", person.wca_id, "Chile", 2016, 850],
      ]
    end
  end

  describe ".compute_rank_tables", clean_db_with_truncation: true do
    let(:australian) { FactoryBot.create :person, countryId: "Australia" }
    let(:canadian) { FactoryBot.create :person, countryId: "Canada" }
    let(:american_1) { FactoryBot.create :person, countryId: "USA" }
    let(:american_2) { FactoryBot.create :person, countryId: "USA" }

    def rank_333(person, ranks_type)
      person.public_send(ranks_type).find_by(eventId: "333").attributes.symbolize_keys
    end

    before do
      FactoryBot.create :result, eventId: "333", best: 600, average: 700, person: australian
      FactoryBot.create :result, eventId: "333", best: 700, average: 800, person: american_1
      FactoryBot.create :result, eventId: "333", best: 800, average: 900, person: canadian
      FactoryBot.create :result, eventId: "333", best: 900, average: 1000, person: american_2
    end

    it "computes world, continental, and national ranking position" do
      AuxiliaryDataComputation.compute_concise_results # Rank tables computation require concise results to be present.
      AuxiliaryDataComputation.compute_rank_tables
      %w(ranksSingle ranksAverage).each do |ranks_type|
        expect(rank_333(australian, ranks_type)).to include(worldRank: 1, continentRank: 1, countryRank: 1)
        expect(rank_333(american_1, ranks_type)).to include(worldRank: 2, continentRank: 1, countryRank: 1)
        expect(rank_333(canadian, ranks_type)).to include(worldRank: 3, continentRank: 2, countryRank: 1)
        expect(rank_333(american_2, ranks_type)).to include(worldRank: 4, continentRank: 3, countryRank: 2)
      end
    end

    it "when a person changes country results from the previous region doesn't apply to the current one" do
      american_1.update_using_sub_id! countryId: "Canada"
      new_canadian = american_1
      australian.update_using_sub_id! countryId: "France"
      new_french = australian
      FactoryBot.create :result, eventId: "333", best: 900, average: 1000, person: new_canadian
      AuxiliaryDataComputation.compute_concise_results # Rank tables computation require concise results to be present.
      AuxiliaryDataComputation.compute_rank_tables
      %w(ranksSingle ranksAverage).each do |ranks_type|
        # NOTE: this person hasn't got any results in Europe/France yet.
        expect(rank_333(new_french, ranks_type)).to include(worldRank: 1, continentRank: 0, countryRank: 0)
        # NOTE: the only change is the countryRank of new_canadian (previously american_1).
        # Note: the continent is still USA, so continentRank shouldn't be affected.
        expect(rank_333(new_canadian, ranks_type)).to include(worldRank: 2, continentRank: 1, countryRank: 2)
        expect(rank_333(canadian, ranks_type)).to include(worldRank: 3, continentRank: 2, countryRank: 1)
        # NOTE: this person stays 2nd in the country.
        expect(rank_333(american_2, ranks_type)).to include(worldRank: 4, continentRank: 3, countryRank: 2)
      end
    end
  end
end
