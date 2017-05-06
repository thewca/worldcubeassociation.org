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
end
