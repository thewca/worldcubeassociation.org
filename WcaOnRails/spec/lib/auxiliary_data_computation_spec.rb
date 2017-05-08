# frozen_string_literal: true

require 'rails_helper'
require 'auxiliary_data_computation'

RSpec.describe "AuxiliaryDataComputation" do
  describe ".compute_best_of_3_in_333bf" do
    def create_new_333bld_result(attributes = {})
      FactoryGirl.build(:result, {
        eventId: "333bf", formatId: "3", roundTypeId: "c",
        value1: 3000, value2: 3000, value3: 3000, best: 3000,
        value4: SolveTime::SKIPPED_VALUE, value5: SolveTime::SKIPPED_VALUE,
        average: SolveTime::SKIPPED_VALUE # Average is not computed yet.
      }.merge(attributes)).tap do |result|
        result.save! validate: false # The average is not valid until we compute it.
      end
    end

    it "leaves average as skipped if one of three solves is skipped" do
      with_skipped_solve = create_new_333bld_result value3: SolveTime::SKIPPED_VALUE
      AuxiliaryDataComputation.compute_best_of_3_in_333bf
      expect(with_skipped_solve.reload.average).to eq SolveTime::SKIPPED_VALUE
    end

    it "sets DNF average if one of three solves is either DNF or DNS" do
      with_dnf = create_new_333bld_result value3: SolveTime::DNF_VALUE
      with_dns = create_new_333bld_result value3: SolveTime::DNS_VALUE
      AuxiliaryDataComputation.compute_best_of_3_in_333bf
      expect(with_dnf.reload.average).to eq SolveTime::DNF_VALUE
      expect(with_dns.reload.average).to eq SolveTime::DNF_VALUE
    end

    it "sets a valid average if all three solves are completed" do
      with_completed_solves = create_new_333bld_result
      AuxiliaryDataComputation.compute_best_of_3_in_333bf
      expect(with_completed_solves.reload.average).to eq 3000
    end

    it "rounds averages over 10 minutes to down to full seconds" do
      over10 = (10.minutes + 10.5.seconds) * 100 # In centiseconds.
      with_completed_solves = create_new_333bld_result value1: over10, value2: over10, value3: over10
      AuxiliaryDataComputation.compute_best_of_3_in_333bf
      expect(with_completed_solves.reload.average).to eq((10.minutes + 10.seconds) * 100)
    end
  end

  describe ".compute_concise_results", clean_db_with_truncation: true do
    let(:person) { FactoryGirl.create :person, countryId: "China" }
    let(:competition_2016) { FactoryGirl.create :competition, starts: Date.parse("2016-04-04") }
    let(:next_competition_2016) { FactoryGirl.create :competition, starts: Date.parse("2016-07-07") }
    let(:competition_2017) { FactoryGirl.create :competition, starts: Date.parse("2017-08-08") }

    it "creates tables containing best results data for each person per event per year" do
      FactoryGirl.create :result, eventId: "333", best: 700, average: 800, competition: competition_2016, person: person
      FactoryGirl.create :result, eventId: "333", best: 750, average: 850, competition: competition_2016, person: person
      FactoryGirl.create :result, eventId: "333", best: 800, average: 900, competition: competition_2017, person: person
      FactoryGirl.create :result, eventId: "222", best: 100, average: 150, competition: competition_2017, person: person
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
      FactoryGirl.create :result, eventId: "333", best: 700, average: 800, competition: competition_2016, person: person
      person.update_using_sub_id! countryId: "Chile"
      FactoryGirl.create :result, eventId: "333", best: 750, average: 850, competition: next_competition_2016, person: person
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
    let(:australian) { FactoryGirl.create :person, countryId: "Australia" }
    let(:canadian) { FactoryGirl.create :person, countryId: "Canada" }
    let(:american_1) { FactoryGirl.create :person, countryId: "USA" }
    let(:american_2) { FactoryGirl.create :person, countryId: "USA" }

    def rank_333(person, ranks_type)
      person.public_send(ranks_type).find_by(eventId: "333").attributes.symbolize_keys
    end

    before do
      FactoryGirl.create :result, eventId: "333", best: 600, average: 700, person: australian
      FactoryGirl.create :result, eventId: "333", best: 700, average: 800, person: american_1
      FactoryGirl.create :result, eventId: "333", best: 800, average: 900, person: canadian
      FactoryGirl.create :result, eventId: "333", best: 900, average: 1000, person: american_2
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
      FactoryGirl.create :result, eventId: "333", best: 900, average: 1000, person: new_canadian
      AuxiliaryDataComputation.compute_concise_results # Rank tables computation require concise results to be present.
      AuxiliaryDataComputation.compute_rank_tables
      %w(ranksSingle ranksAverage).each do |ranks_type|
        # Note: this person hasn't got any results in Europe/France yet.
        expect(rank_333(new_french, ranks_type)).to include(worldRank: 1, continentRank: 0, countryRank: 0)
        # Note: the only change is the countryRank of new_canadian (previously american_1).
        # Note: the continent is still USA, so continentRank shouldn't be affected.
        expect(rank_333(new_canadian, ranks_type)).to include(worldRank: 2, continentRank: 1, countryRank: 2)
        expect(rank_333(canadian, ranks_type)).to include(worldRank: 3, continentRank: 2, countryRank: 1)
        # Note: this person stays 2nd in the country.
        expect(rank_333(american_2, ranks_type)).to include(worldRank: 4, continentRank: 3, countryRank: 2)
      end
    end
  end
end
