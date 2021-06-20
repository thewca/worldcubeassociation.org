# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Result do
  it "defines a valid result" do
    result = FactoryBot.build :result
    expect(result).to be_valid
  end

  context "associations" do
    it "validates competitionId" do
      result = FactoryBot.build :result, competitionId: "foo", skip_round_creation: true
      expect(result).to be_invalid_with_errors(competition: ["can't be blank"])
    end

    it "validates countryId" do
      result = FactoryBot.build :result, countryId: "foo"
      expect(result).to be_invalid_with_errors(country: ["can't be blank"])
    end

    it "validates eventId" do
      result = FactoryBot.build :result, eventId: "foo", skip_round_creation: true
      expect(result).to be_invalid_with_errors(event: ["can't be blank"])
    end

    it "validates formatId" do
      result = FactoryBot.build :result, formatId: "foo", skip_round_creation: true
      expect(result).to be_invalid_with_errors(format: ["can't be blank"])
    end

    it "validates roundTypeId" do
      result = FactoryBot.build :result, roundTypeId: "foo", skip_round_creation: true
      # Skipping the round creation also creates a round validation error which
      # is reported on :round_type.
      expect(result).to be_invalid_with_errors(round_type:
      [
        "can't be blank",
        "Result must belong to a valid round. Please check that the tuple (competitionId, eventId, roundTypeId, formatId) matches an existing round.",
      ])
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
      result = FactoryBot.build :result, value1: -2, value2: -2, value3: 0, value4: 0, value5: 0, best: -2
      expect(result).to be_invalid_with_errors(base: ["All solves cannot be DNS/skipped."])
    end

    it "values must all be >= -2" do
      result = FactoryBot.build :result, value1: 0, value2: -3, value3: 0, value4: 0, value5: 0
      expect(result).to be_invalid(value2: ["invalid"])
    end

    it "position must be a number" do
      result = FactoryBot.build :result, pos: nil
      expect(result).to be_invalid(pos: ["The position is not a valid number. Did you clear all the empty rows and synchronized WCA Live?"])
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
        let(:competition) { FactoryBot.create(:competition) }

        context "cutoff round" do
          let(:roundTypeId) { "c" }
          let!(:round) { FactoryBot.create(:round, competition: competition, cutoff: Cutoff.new(number_of_attempts: 2, attempt_result: 60*100)) }

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

        context "uncutoff round" do
          let(:roundTypeId) { "f" }
          let!(:round) { FactoryBot.create(:round, competition: competition) }

          it "all solves with average below 10 minutes" do
            # This average computes to 44.0066... and should be rounded to 44.01
            result = build_result(value1: 4200, value2: 4300, value3: 4400, value4: 4502, value5: 4600, best: 4200, average: 4401)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 4401
            expect(result).to be_invalid_with_errors(average: ["should be 4401"])
          end

          it "all solves with average above 10 minutes" do
            # This average computes to 600.66... and should be rounded to 601
            result = build_result(value1: 1001, value2: 60_100, value3: 60_100, value4: 60_000, value5: 70_000, best: 1001, average: 60_100)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 60_100
            expect(result).to be_invalid_with_errors(average: ["should be 60100"])
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
          let(:competition) { FactoryBot.create(:competition, event_ids: ["777"]) }

          context "cutoff round" do
            let(:roundTypeId) { "c" }
            let!(:round) { FactoryBot.create(:round, competition: competition, cutoff: Cutoff.new(number_of_attempts: 2, attempt_result: 60*100), format_id: "m", event_id: "777") }

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

          context "uncutoff round" do
            let(:roundTypeId) { "f" }
            let!(:round) { FactoryBot.create(:round, competition: competition, format_id: "m", event_id: "777") }

            it "all solves with average below 10 minutes" do
              # This average computes to 44.0066... and should be rounded to 44.01
              result = build_result(value1: 4300, value2: 4502, value3: 4400, value4: 0, value5: 0, best: 4300, average: 4401)
              expect(result).to be_valid

              result.average = 33
              expect(result.compute_correct_average).to eq 4401
              expect(result).to be_invalid_with_errors(average: ["should be 4401"])
            end

            it "all solves with average above 10 minutes" do
              # This average computes to 600.66... and should be rounded to 601
              result = build_result(value1: 60_100, value2: 60_100, value3: 60_000, value4: 0, value5: 0, best: 60_000, average: 60_100)
              expect(result).to be_valid

              result.average = 33
              expect(result.compute_correct_average).to eq 60_100
              expect(result).to be_invalid_with_errors(average: ["should be 60100"])
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

        context "333fm uncutoff round" do
          let(:eventId) { "333fm" }
          let(:roundTypeId) { "f" }
          let(:competition) { FactoryBot.create(:competition, event_ids: ["333fm"]) }
          let!(:round) { FactoryBot.create(:round, competition: competition, format_id: "m", event_id: "333fm") }

          it "correctly computes average" do
            result = build_result(value1: 42, value2: 42, value3: 43, value4: 0, value5: 0, best: 42, average: 4233)
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
        let(:roundTypeId) { "f" }
        let(:competition) { FactoryBot.create(:competition, event_ids: ["333bf", "444bf", "555bf", "333mbf", "333ft", "333fm"]) }

        context "333bf" do
          let(:formatId) { "3" }
          let(:eventId) { "333bf" }
          let!(:round) { FactoryBot.create(:round, competition: competition, event_id: "333bf", format_id: "3") }

          it "does compute average" do
            result = build_result(value1: 999, value2: 1000, value3: 1001, value4: 0, value5: 0, best: 999, average: 1000)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 1000
            expect(result).to be_invalid_with_errors(average: ["should be 1000"])
          end

          it "leaves average for 333bf as skipped if one of three solves is skipped" do
            result = build_result(value1: 3000, value2: 3000,
                                  value3: SolveTime::SKIPPED_VALUE,
                                  value4: SolveTime::SKIPPED_VALUE,
                                  value5: SolveTime::SKIPPED_VALUE)
            expect(result.compute_correct_average).to eq SolveTime::SKIPPED_VALUE
          end

          it "sets DNF average for 333bf if one of three solves is either DNF or DNS" do
            result_dns = build_result(value1: 3000, value2: 3000,
                                      value3: SolveTime::DNS_VALUE,
                                      value4: SolveTime::SKIPPED_VALUE,
                                      value5: SolveTime::SKIPPED_VALUE)
            result_dnf = build_result(value1: 3000, value2: 3000,
                                      value3: SolveTime::DNF_VALUE,
                                      value4: SolveTime::SKIPPED_VALUE,
                                      value5: SolveTime::SKIPPED_VALUE)
            expect(result_dnf.compute_correct_average).to eq SolveTime::DNF_VALUE
            expect(result_dns.compute_correct_average).to eq SolveTime::DNF_VALUE
          end

          # https://www.worldcubeassociation.org/regulations/#9f2
          it "rounds averages for 333bf over 10 minutes down to nearest second for x.49" do
            over10 = (10.minutes + 10.49.seconds) * 100 # In centiseconds.
            result = build_result(value1: over10,
                                  value2: over10,
                                  value3: over10,
                                  value4: SolveTime::SKIPPED_VALUE,
                                  value5: SolveTime::SKIPPED_VALUE)
            expect(result.compute_correct_average).to eq((10.minutes + 10.seconds) * 100)
          end

          # https://www.worldcubeassociation.org/regulations/#9f2
          it "rounds averages for 333bf over 10 minutes up to nearest second for x.50" do
            over10 = (10.minutes + 10.50.seconds) * 100 # In centiseconds.
            result = build_result(value1: over10,
                                  value2: over10,
                                  value3: over10,
                                  value4: SolveTime::SKIPPED_VALUE,
                                  value5: SolveTime::SKIPPED_VALUE)
            expect(result.compute_correct_average).to eq((10.minutes + 11.seconds) * 100)
          end
        end

        context "444bf" do
          let(:formatId) { "3" }
          let(:eventId) { "444bf" }
          let!(:round) { FactoryBot.create(:round, competition: competition, event_id: "444bf", format_id: "3") }

          it "sets a valid average for 444bf if all three solves are completed" do
            result = build_result(value1: 999, value2: 1000, value3: 1001, value4: 0, value5: 0, best: 999, average: 1000)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 1000
            expect(result).to be_invalid_with_errors(average: ["should be 1000"])
          end
        end

        context "555bf" do
          let(:formatId) { "3" }
          let(:eventId) { "555bf" }
          let!(:round) { FactoryBot.create(:round, competition: competition, event_id: "555bf", format_id: "3") }

          it "sets a valid average for 555bf if all three solves are completed" do
            result = build_result(value1: 999, value2: 1000, value3: 1001, value4: 0, value5: 0, best: 999, average: 1000)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 1000
            expect(result).to be_invalid_with_errors(average: ["should be 1000"])
          end
        end

        context "333fm" do
          let(:formatId) { "m" }
          let(:eventId) { "333fm" }
          let!(:round) { FactoryBot.create(:round, competition: competition, event_id: "333fm", format_id: "m") }

          it "does compute average" do
            result = build_result(value1: 24, value2: 25, value3: 26, value4: 0, value5: 0, best: 24, average: 2500)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 2500
            expect(result).to be_invalid_with_errors(average: ["should be 2500"])
          end
        end

        context "333ft" do
          let(:formatId) { "3" }
          let(:eventId) { "333ft" }
          let!(:round) { FactoryBot.create(:round, competition: competition, event_id: "333ft", format_id: "3") }

          it "does compute average" do
            result = build_result(value1: 999, value2: 1000, value3: 1001, value4: 0, value5: 0, best: 999, average: 1000)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 1000
            expect(result).to be_invalid_with_errors(average: ["should be 1000"])
          end
        end

        context "333mbf" do
          let(:formatId) { "3" }
          let(:eventId) { "333mbf" }
          let!(:round) { FactoryBot.create(:round, competition: competition, event_id: "333mbf", format_id: "3") }

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
    end

    context "check number of non-zero solves" do
      def result_with_n_solves(n, options)
        result = FactoryBot.build :result, options
        (1..5).each do |i|
          result.send "value#{i}=", i <= n ? 42 : 0
        end
        result
      end

      context "non-cutoff rounds" do
        it "format 1" do
          result = result_with_n_solves(2, roundTypeId: "1", formatId: "1", eventId: "333mbf")
          expect(result).to be_invalid_with_errors(base: ["Expected 1 solve, but found 2."])
        end

        it "format 2" do
          result = result_with_n_solves(3, roundTypeId: "1", formatId: "2", eventId: "333mbf")
          expect(result).to be_invalid_with_errors(base: ["Expected 2 solves, but found 3."])
        end

        it "format 3" do
          result = result_with_n_solves(2, roundTypeId: "1", formatId: "3", eventId: "333bf")
          expect(result).to be_invalid_with_errors(base: ["Expected 3 solves, but found 2."])
        end

        it "format m" do
          result = result_with_n_solves(2, roundTypeId: "1", formatId: "m", eventId: "333fm")
          expect(result).to be_invalid_with_errors(base: ["Expected 3 solves, but found 2."])
        end

        it "format a" do
          result = result_with_n_solves(2, roundTypeId: "1", formatId: "a")
          expect(result).to be_invalid_with_errors(base: ["Expected 5 solves, but found 2."])
        end
      end

      context "cutoff rounds" do
        it "format 2" do
          result = result_with_n_solves(3, roundTypeId: "c", formatId: "2", eventId: "333mbf")
          expect(result).to be_invalid_with_errors(base: ["Expected at most 2 solves, but found 3."])
        end

        it "format 3" do
          result = result_with_n_solves(4, roundTypeId: "c", formatId: "3", eventId: "333bf")
          expect(result).to be_invalid_with_errors(base: ["Expected at most 3 solves, but found 4."])
        end

        it "format m" do
          result = result_with_n_solves(4, roundTypeId: "c", formatId: "m", eventId: "777")
          expect(result).to be_invalid_with_errors(base: ["Expected at most 3 solves, but found 4."])
        end
      end
    end

    it "times over 10 minutes must be rounded" do
      expect(FactoryBot.build(:result, value2: (10*6000) + 4343)).to be_invalid_with_errors(value2: ["times over 10 minutes should be rounded"])
      expect(FactoryBot.build(:result, value2: (10*6000) + 4300)).to be_valid
    end

    context "multibld" do
      # Enforce https://www.worldcubeassociation.org/regulations/#H1b.
      it "time must be below one hour" do
        solve_time = SolveTime.new("333mbf", :single, 0)
        solve_time.solved = 28
        solve_time.attempted = 30
        solve_time.time_centiseconds = 65*60*100

        result = FactoryBot.build :result, eventId: "333mbf", value1: solve_time.wca_value, formatId: "1"
        expect(result).to be_invalid_with_errors(value1: ["should be less than or equal to 60 minutes"])
      end

      it "time must be below 30 minutes if they attempted 3 cubes" do
        solve_time = SolveTime.new("333mbf", :single, 0)
        solve_time.solved = 2
        solve_time.attempted = 3
        solve_time.time_centiseconds = 32*60*100

        result = FactoryBot.build :result, eventId: "333mbf", value1: solve_time.wca_value, formatId: "1"
        expect(result).to be_invalid_with_errors(value1: ["should be less than or equal to 30 minutes"])
      end
    end
  end
end

def build_result(attrs)
  FactoryBot.build :result, { competition: competition, roundTypeId: roundTypeId, formatId: formatId, eventId: eventId }.merge(attrs)
end
