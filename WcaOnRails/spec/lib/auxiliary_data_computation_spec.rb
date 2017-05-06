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
      over_10 = (10.minutes + 10.5.seconds) * 100 # In centiseconds.
      with_completed_solves = create_new_333bld_result value1: over_10, value2: over_10, value3: over_10
      AuxiliaryDataComputation.compute_best_of_3_in_333bf
      expect(with_completed_solves.reload.average).to eq (10.minutes + 10.seconds) * 100
    end
  end

  describe ".compute_concise_results", clean_db_with_truncation: true do
    let(:person) { FactoryGirl.create :person, countryId: "China" }
    let(:competition_2016) { FactoryGirl.create :competition, starts: Date.parse("2016-04-04") }
    let(:next_competition_2016) { FactoryGirl.create :competition, starts: Date.parse("2016-07-07") }
    let(:competition_2017) { FactoryGirl.create :competition, starts: Date.parse("2017-08-08") }

    it "creates tables containing best results data for each person per even per year" do
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
end
