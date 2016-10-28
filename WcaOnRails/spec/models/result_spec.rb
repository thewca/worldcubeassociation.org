# frozen_string_literal: true
require 'rails_helper'

RSpec.describe Result do
  it "defines a valid result" do
    result = FactoryGirl.build :result
    expect(result).to be_valid
  end

  context "associations" do
    it "validates competitionId" do
      result = FactoryGirl.build :result, competitionId: "foo"
      expect(result).to be_invalid
    end

    it "validates countryId" do
      result = FactoryGirl.build :result, countryId: "foo"
      expect(result).to be_invalid
    end

    it "validates eventId" do
      result = FactoryGirl.build :result, eventId: "foo"
      expect(result).to be_invalid
    end

    it "validates formatId" do
      result = FactoryGirl.build :result, formatId: "foo"
      expect(result).to be_invalid
    end

    it "validates roundId" do
      result = FactoryGirl.build :result, roundId: "foo"
      expect(result).to be_invalid
    end

    it "person association always looks for subId 1" do
      person1 = FactoryGirl.create :person_with_multiple_sub_ids
      person2 = Person.find_by!(wca_id: person1.wca_id, subId: 2)
      result1 = FactoryGirl.create :result, person: person1
      result2 = FactoryGirl.create :result, person: person2
      expect(result1.person).to eq person1
      expect(result2.person).to eq person1
    end
  end

  context "valid" do
    it "skipped solves must all come at the end" do
      result = FactoryGirl.build :result, value2: 0
      expect(result).to be_invalid
      expect(result.errors.messages[:base]).to eq ["Skipped solves must all come at the end."]
    end

    it "cannot skip all solves" do
      result = FactoryGirl.build :result, value1: 0, value2: 0, value3: 0, value4: 0, value5: 0
      expect(result).to be_invalid
      expect(result.errors.messages[:base]).to eq ["Cannot skip all solves."]
    end

    it "values must all be >= -2" do
      result = FactoryGirl.build :result, value1: 0, value2: -3, value3: 0, value4: 0, value5: 0
      expect(result).to be_invalid
      expect(result.errors.messages[:value2]).to eq ["invalid"]
    end

    it "correctly computes best" do
      result = FactoryGirl.build :result, value1: 42, value2: 43, value3: 44, value4: 45, value5: 46, best: 42, average: 44
      expect(result).to be_valid

      result.best = 41
      expect(result).to be_invalid
      expect(result.errors.messages[:best]).to eq ["should be 42"]
    end

    context "correctly computes average" do
      it "average 5" do
        result = FactoryGirl.build :result, value1: 42, value2: 43, value3: 44, value4: 45, value5: 46, best: 42, average: 44
        expect(result).to be_valid

        result.average = 33
        expect(result).to be_invalid
        expect(result.errors.messages[:average]).to eq ["should be 44"]
      end

      it "mean of 3" do
        result = FactoryGirl.build :result, value1: 42, value2: 43, value3: 44, value4: 45, value5: 46, best: 42, average: 44
        expect(result).to be_valid

        result.average = 33
        expect(result).to be_invalid
        expect(result.errors.messages[:average]).to eq ["should be 44"]
      end

      it "fmc" do
        result = FactoryGirl.build :result, eventId: "333fm", formatId: "m", value1: 42, value2: 42, value3: 43, value4: 0, value5: 0, best: 42, average: 4233
        expect(result).to be_valid

        result.average = 4200
        expect(result).to be_invalid
        expect(result.errors.messages[:average]).to eq ["should be 4233"]
      end
    end

    context "check number of non-zero solves" do
      def result_with_n_solves(n, options)
        result = FactoryGirl.build :result, options
        (1..5).each do |i|
          result.send "value#{i}=", i <= n ? 42 : 0
        end
        result
      end

      context "non-combined rounds" do
        it "format 1" do
          result = result_with_n_solves(2, roundId: "1", formatId: "1")
          expect(result).to be_invalid
          expect(result.errors.messages[:base]).to eq ["Expected 1 solve, but found 2."]
        end

        it "format 2" do
          result = result_with_n_solves(3, roundId: "1", formatId: "2")
          expect(result).to be_invalid
          expect(result.errors.messages[:base]).to eq ["Expected 2 solves, but found 3."]
        end

        it "format 3" do
          result = result_with_n_solves(2, roundId: "1", formatId: "3")
          expect(result).to be_invalid
          expect(result.errors.messages[:base]).to eq ["Expected 3 solves, but found 2."]
        end

        it "format m" do
          result = result_with_n_solves(2, roundId: "1", formatId: "m")
          expect(result).to be_invalid
          expect(result.errors.messages[:base]).to eq ["Expected 3 solves, but found 2."]
        end

        it "format a" do
          result = result_with_n_solves(2, roundId: "1", formatId: "a")
          expect(result).to be_invalid
          expect(result.errors.messages[:base]).to eq ["Expected 5 solves, but found 2."]
        end
      end

      context "combined rounds" do
        it "format 2" do
          result = result_with_n_solves(3, roundId: "c", formatId: "2")
          expect(result).to be_invalid
          expect(result.errors.messages[:base]).to eq ["Expected at most 2 solves, but found 3."]
        end

        it "format 3" do
          result = result_with_n_solves(4, roundId: "c", formatId: "3")
          expect(result).to be_invalid
          expect(result.errors.messages[:base]).to eq ["Expected at most 3 solves, but found 4."]
        end

        it "format m" do
          result = result_with_n_solves(4, roundId: "c", formatId: "m")
          expect(result).to be_invalid
          expect(result.errors.messages[:base]).to eq ["Expected at most 3 solves, but found 4."]
        end
      end
    end

    it "times over 10 minutes must be rounded" do
      result = FactoryGirl.build :result, value2: 10*6000 + 4343
      expect(result).to be_invalid
      expect(result.errors.messages[:value2]).to eq ["times over 10 minutes should be rounded"]

      result.value2 = 10*6000 + 4300
      result.average = 6000
      expect(result).to be_valid
    end

    context "multibld" do
      # Enforce https://www.worldcubeassociation.org/regulations/#H1b.
      it "time must be below one hour" do
        solve_time = SolveTime.new("333mbf", :single, 0)
        solve_time.solved = 28
        solve_time.attempted = 30
        solve_time.time_centiseconds = 65*60*100

        result = FactoryGirl.build :result, eventId: "333mbf", value1: solve_time.wca_value
        expect(result).to be_invalid
        expect(result.errors.messages[:value1]).to eq ["should be less than or equal to 60 minutes"]
      end

      it "time must be below 30 minutes if they attempted 3 cubes" do
        solve_time = SolveTime.new("333mbf", :single, 0)
        solve_time.solved = 2
        solve_time.attempted = 3
        solve_time.time_centiseconds = 31*60*100

        result = FactoryGirl.build :result, eventId: "333mbf", value1: solve_time.wca_value
        expect(result).to be_invalid
        expect(result.errors.messages[:value1]).to eq ["should be less than or equal to 30 minutes"]
      end
    end
  end
end
