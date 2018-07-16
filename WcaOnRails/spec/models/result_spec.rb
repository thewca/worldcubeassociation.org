# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Result do
  it "defines a valid result" do
    result = FactoryBot.build :result
    expect(result).to be_valid
  end

  context "associations" do
    it "validates competitionId" do
      result = FactoryBot.build :result, competitionId: "foo"
      expect(result).to be_invalid_with_errors(competition: ["can't be blank"])
    end

    it "validates countryId" do
      result = FactoryBot.build :result, countryId: "foo"
      expect(result).to be_invalid_with_errors(country: ["can't be blank"])
    end

    it "validates eventId" do
      result = FactoryBot.build :result, eventId: "foo"
      expect(result).to be_invalid_with_errors(event: ["can't be blank"])
    end

    it "validates formatId" do
      result = FactoryBot.build :result, formatId: "foo"
      expect(result).to be_invalid_with_errors(format: ["can't be blank"])
    end

    it "validates roundTypeId" do
      result = FactoryBot.build :result, roundTypeId: "foo"
      expect(result).to be_invalid_with_errors(round_type: ["can't be blank"])
    end

    it "person association always looks for subId 1" do
      person1 = FactoryBot.create :person_with_multiple_sub_ids
      person2 = Person.find_by!(wca_id: person1.wca_id, subId: 2)
      result1 = FactoryBot.create :result, person: person1
      result2 = FactoryBot.create :result, person: person2
      expect(result1.person).to eq person1
      expect(result2.person).to eq person1
    end
  end

  context "valid" do
    it "skipped solves must all come at the end" do
      result = FactoryBot.build :result, value2: 0
      expect(result).to be_invalid_with_errors(base: ["Skipped solves must all come at the end."])
    end

    it "cannot skip all solves" do
      result = FactoryBot.build :result, value1: 0, value2: 0, value3: 0, value4: 0, value5: 0
      expect(result).to be_invalid_with_errors(base: ["Cannot skip all solves."])
    end

    it "values must all be >= -2" do
      result = FactoryBot.build :result, value1: 0, value2: -3, value3: 0, value4: 0, value5: 0
      expect(result).to be_invalid(value2: ["invalid"])
    end

    it "correctly computes best" do
      result = FactoryBot.build :result, value1: 42, value2: 43, value3: 44, value4: 45, value5: 46, best: 42, average: 44
      expect(result).to be_valid

      result.best = 41
      expect(result).to be_invalid(best: ["should be 42"])
    end

    context "correctly computes average" do
      context "333 average 5" do
        let(:eventId) { "333" }
        let(:formatId) { "a" }

        context "combined round" do
          let(:roundTypeId) { "c" }

          it "all solves" do
            result = build_result(value1: 42, value2: 43, value3: 44, value4: 45, value5: 46, best: 42, average: 44)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 44
            expect(result).to be_invalid(average: ["should be 44"])
          end

          it "missing solves" do
            result = build_result(value1: 42, value2: 43, value3: 44, value4: 0, value5: 0, best: 42, average: 44)
            expect(result.average_is_not_computable_reason).to eq nil
            expect(result.compute_correct_average).to eq 0
            expect(result).to be_invalid(average: ["should be 0"])
          end
        end

        context "uncombined round" do
          let(:roundTypeId) { "1" }

          it "all solves" do
            result = build_result(value1: 42, value2: 43, value3: 44, value4: 45, value5: 46, best: 42, average: 44)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 44
            expect(result).to be_invalid_with_errors(average: ["should be 44"])
          end

          it "DNF average" do
            result = build_result(value1: SolveTime::DNF_VALUE, value2: 43, value3: SolveTime::DNF_VALUE, value4: 45, value5: 46, best: 43, average: SolveTime::DNF_VALUE)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq SolveTime::DNF_VALUE
            expect(result).to be_invalid_with_errors(average: ["should be -1"])
          end

          it "missing solves" do
            result = build_result(value1: 42, value2: 43, value3: 44, value4: 0, value5: 0, best: 42, average: 44)
            expect(result.average_is_not_computable_reason).to be_truthy
          end
        end
      end

      context "mean of 3" do
        let(:formatId) { "m" }

        context "777" do
          let(:eventId) { "777" }

          context "combined round" do
            let(:roundTypeId) { "c" }

            it "all solves" do
              result = build_result(value1: 42, value2: 43, value3: 44, value4: 0, value5: 0, best: 42, average: 43)
              expect(result).to be_valid

              result.average = 33
              expect(result.compute_correct_average).to eq 43
              expect(result).to be_invalid_with_errors(average: ["should be 43"])
            end

            it "missing solves" do
              result = build_result(value1: 42, value2: 0, value3: 0, value4: 0, value5: 0, best: 42, average: 0)
              expect(result).to be_valid

              result.average = 33
              expect(result.compute_correct_average).to eq 0
              expect(result).to be_invalid_with_errors(average: ["should be 0"])
            end

            it "too many solves" do
              result = build_result(value1: 42, value2: 43, value3: 44, value4: 45, value5: 46, best: 42, average: 43)
              expect(result.average_is_not_computable_reason).to be_truthy
              expect(result).to be_invalid_with_errors(base: ["Expected at most 3 solves, but found 5."])
            end
          end

          context "uncombined round" do
            let(:roundTypeId) { "1" }

            it "all solves" do
              result = build_result(value1: 42, value2: 43, value3: 44, value4: 0, value5: 0, best: 42, average: 43)
              expect(result).to be_valid

              result.average = 33
              expect(result.compute_correct_average).to eq 43
              expect(result).to be_invalid_with_errors(average: ["should be 43"])
            end

            it "rounds instead of truncates" do
              result = build_result(value1: 4, value2: 4, value3: 3, value4: 0, value5: 0, best: 3, average: 4)
              expect(result).to be_valid

              result.average = 33
              expect(result.compute_correct_average).to eq 4
              expect(result).to be_invalid_with_errors(average: ["should be 4"])
            end

            it "missing solves" do
              result = build_result(value1: 42, value2: 0, value3: 0, value4: 0, value5: 0, best: 42, average: 0)
              expect(result.average_is_not_computable_reason).to be_truthy
              expect(result).to be_invalid_with_errors(base: ["Expected 3 solves, but found 1."])
            end

            it "too many solves" do
              result = build_result(value1: 42, value2: 43, value3: 44, value4: 45, value5: 46, best: 42, average: 43)
              expect(result.average_is_not_computable_reason).to be_truthy
              expect(result).to be_invalid_with_errors(base: ["Expected 3 solves, but found 5."])
            end
          end
        end

        context "333fm uncombined round" do
          let(:eventId) { "333fm" }
          let(:roundTypeId) { "1" }

          it "correctly computes average" do
            result = build_result(eventId: "333fm", formatId: "m", value1: 42, value2: 42, value3: 43, value4: 0, value5: 0, best: 42, average: 4233)
            expect(result).to be_valid

            result.average = 4200
            expect(result.compute_correct_average).to eq 4233
            expect(result).to be_invalid_with_errors(average: ["should be 4233"])
          end

          it "correctly computes DNF average" do
            result = build_result(value1: 42, value2: SolveTime::DNF_VALUE, value3: 44, value4: 0, value5: 0, best: 42, average: SolveTime::DNF_VALUE)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq(-1)
            expect(result).to be_invalid_with_errors(average: ["should be -1"])
          end
        end
      end

      context "best of 3" do
        let(:formatId) { "3" }
        let(:roundTypeId) { "1" }

        context "333bf" do
          let(:eventId) { "333bf" }

          it "does compute average" do
            result = build_result(value1: 999, value2: 1000, value3: 1001, value4: 0, value5: 0, best: 999, average: 1000)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 1000
            expect(result).to be_invalid_with_errors(average: ["should be 1000"])
          end
        end

        context "333fm" do
          let(:eventId) { "333fm" }

          it "does compute average" do
            result = build_result(value1: 24, value2: 25, value3: 26, value4: 0, value5: 0, best: 24, average: 2500)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 2500
            expect(result).to be_invalid_with_errors(average: ["should be 2500"])
          end
        end

        context "333ft" do
          let(:eventId) { "333ft" }

          it "does compute average" do
            result = build_result(value1: 999, value2: 1000, value3: 1001, value4: 0, value5: 0, best: 999, average: 1000)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 1000
            expect(result).to be_invalid_with_errors(average: ["should be 1000"])
          end
        end

        context "333mbf" do
          let(:eventId) { "333mbf" }

          it "does not compute average" do
            solve_time = SolveTime.new("333mbf", :best, 0)
            solve_time.attempted = 9
            solve_time.solved = 8
            solve_time.time_centiseconds = (45.minutes + 32.seconds).in_centiseconds
            val = solve_time.wca_value

            result = build_result(value1: val, value2: val, value3: val, value4: 0, value5: 0, best: val, average: 0)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 0
            expect(result).to be_invalid_with_errors(average: ["should be 0"])
          end
        end
      end

      context "333 best of 2" do
        let(:formatId) { "2" }
        let(:roundTypeId) { "1" }

        context "333" do
          let(:eventId) { "333" }

          it "does not compute average" do
            result = build_result(value1: 999, value2: 1000, value3: 0, value4: 0, value5: 0, best: 999, average: 0)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 0
            expect(result).to be_invalid_with_errors(average: ["should be 0"])
          end
        end
      end
    end

    context "check number of non-zero solves" do
      def result_with_n_solves(n, options)
        result = FactoryBot.build :result, options
        (1..5).each do |i|
          result.send "value#{i}=", i <= n ? 42 : 0
        end
        result
      end

      context "non-combined rounds" do
        it "format 1" do
          result = result_with_n_solves(2, roundTypeId: "1", formatId: "1")
          expect(result).to be_invalid_with_errors(base: ["Expected 1 solve, but found 2."])
        end

        it "format 2" do
          result = result_with_n_solves(3, roundTypeId: "1", formatId: "2")
          expect(result).to be_invalid_with_errors(base: ["Expected 2 solves, but found 3."])
        end

        it "format 3" do
          result = result_with_n_solves(2, roundTypeId: "1", formatId: "3")
          expect(result).to be_invalid_with_errors(base: ["Expected 3 solves, but found 2."])
        end

        it "format m" do
          result = result_with_n_solves(2, roundTypeId: "1", formatId: "m")
          expect(result).to be_invalid_with_errors(base: ["Expected 3 solves, but found 2."])
        end

        it "format a" do
          result = result_with_n_solves(2, roundTypeId: "1", formatId: "a")
          expect(result).to be_invalid_with_errors(base: ["Expected 5 solves, but found 2."])
        end
      end

      context "combined rounds" do
        it "format 2" do
          result = result_with_n_solves(3, roundTypeId: "c", formatId: "2")
          expect(result).to be_invalid_with_errors(base: ["Expected at most 2 solves, but found 3."])
        end

        it "format 3" do
          result = result_with_n_solves(4, roundTypeId: "c", formatId: "3")
          expect(result).to be_invalid_with_errors(base: ["Expected at most 3 solves, but found 4."])
        end

        it "format m" do
          result = result_with_n_solves(4, roundTypeId: "c", formatId: "m")
          expect(result).to be_invalid_with_errors(base: ["Expected at most 3 solves, but found 4."])
        end
      end
    end

    it "times over 10 minutes must be rounded" do
      expect(FactoryBot.build(:result, value2: 10*6000 + 4343)).to be_invalid_with_errors(value2: ["times over 10 minutes should be rounded"])
      expect(FactoryBot.build(:result, value2: 10*6000 + 4300)).to be_valid
    end

    context "multibld" do
      # Enforce https://www.worldcubeassociation.org/regulations/#H1b.
      it "time must be below one hour" do
        solve_time = SolveTime.new("333mbf", :single, 0)
        solve_time.solved = 28
        solve_time.attempted = 30
        solve_time.time_centiseconds = 65*60*100

        result = FactoryBot.build :result, eventId: "333mbf", value1: solve_time.wca_value
        expect(result).to be_invalid_with_errors(value1: ["should be less than or equal to 60 minutes"])
      end

      it "time must be below 30 minutes if they attempted 3 cubes" do
        solve_time = SolveTime.new("333mbf", :single, 0)
        solve_time.solved = 2
        solve_time.attempted = 3
        solve_time.time_centiseconds = 31*60*100

        result = FactoryBot.build :result, eventId: "333mbf", value1: solve_time.wca_value
        expect(result).to be_invalid_with_errors(value1: ["should be less than or equal to 30 minutes"])
      end
    end
  end
end

def build_result(attrs)
  FactoryBot.build :result, { roundTypeId: roundTypeId, formatId: formatId, eventId: eventId }.merge(attrs)
end
