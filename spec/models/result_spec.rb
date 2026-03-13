# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Result do
  it "defines a valid result" do
    result = build(:result)
    expect(result).to be_valid
  end

  context "with previous light_result methods" do
    let(:competition) { create(:competition) }
    let(:format_id) { "a" }
    let(:round_type_id) { "c" }
    let(:event_id) { "333" }

    it "correctly computes best_index and worst_index" do
      result = build_result("event_id" => "333", "value1" => 10, "value2" => 30, "value3" => 50, "value4" => 40, "value5" => 60)
      expect(result.best_index).to eq 0
      expect(result.worst_index).to eq 4
    end

    describe "trimmed_indices" do
      it "trims best and worst for format: average" do
        result = build_result "event_id" => "333", "value1" => 20, "value2" => 10, "value3" => 60, "value4" => 40, "value5" => 50, "format_id" => "a"
        expect(result.trimmed_indices).to eq [1, 2]
      end

      it "does not trim anything for format: mean" do
        result = build_result "event_id" => "666", "value1" => 20, "value2" => 10, "value3" => 60, "value4" => SolveTime::SKIPPED_VALUE, "value5" => SolveTime::SKIPPED_VALUE, "average" => 30, "format_id" => "m"
        expect(result.trimmed_indices).to eq []
      end

      it "handles cutoff rounds" do
        result = build_result "event_id" => "333", "value1" => 20, "value2" => 10, "value3" => 60, "value4" => SolveTime::SKIPPED_VALUE, "value5" => SolveTime::SKIPPED_VALUE, "average" => SolveTime::SKIPPED_VALUE, "format_id" => "a"
        expect(result.trimmed_indices).to eq []
      end
    end

    describe "solves" do
      it "cutoff round and didn't make cutoff" do
        result = build_result "event_id" => "333", "value1" => 20, "value2" => 10, "value3" => 60, "value4" => SolveTime::SKIPPED_VALUE, "value5" => SolveTime::SKIPPED_VALUE, "average" => SolveTime::SKIPPED_VALUE, "format_id" => "a"
        expect(result.format.expected_solve_count).to eq 5
        expect(result.solve_times).to eq [
          solve_time(20), solve_time(10), solve_time(60), solve_time(SolveTime::SKIPPED_VALUE), solve_time(SolveTime::SKIPPED_VALUE)
        ]
      end

      it "returns 5 SolveTimes even for a round with 3 solves" do
        result = build_result "event_id" => "333bf", "value1" => 20, "value2" => 10, "value3" => 60, "value4" => SolveTime::SKIPPED_VALUE, "value5" => SolveTime::SKIPPED_VALUE, "average" => SolveTime::SKIPPED_VALUE, "format_id" => "3"
        expect(result.format.expected_solve_count).to eq 3
        expect(result.solve_times).to eq [
          solve_time(20), solve_time(10), solve_time(60), solve_time(SolveTime::SKIPPED_VALUE), solve_time(SolveTime::SKIPPED_VALUE)
        ]
      end
    end
  end

  context "associations" do
    it "validates competition_id" do
      result = build(:result, competition_id: "foo")
      expect(result).to be_invalid_with_errors(competition: ["must exist"])
    end

    it "validates country_id" do
      result = build(:result, country_id: "foo")
      expect(result).to be_invalid_with_errors(country: ["must exist"])
    end

    it "validates event_id" do
      result = build(:result, event_id: "foo")
      expect(result).to be_invalid_with_errors(event: ["must exist"])
    end

    it "validates format_id" do
      result = build(:result, format_id: "foo")
      expect(result).to be_invalid_with_errors(format: ["must exist"])
    end

    it "validates round_type_id" do
      result = build(:result, round_type_id: "foo")
      expect(result).to be_invalid_with_errors(round_type: ["must exist"])
    end

    it "person association always looks for sub_id 1" do
      person1 = create(:person_with_multiple_sub_ids)
      person2 = Person.find_by!(wca_id: person1.wca_id, sub_id: 2)
      result1 = create(:result, person: person1)
      result2 = create(:result, person: person2)
      expect(result1.person).to eq person1
      expect(result2.person).to eq person1
    end
  end

  context "valid" do
    it "skipped solves must all come at the end" do
      result = build(:result, value2: 0)
      expect(result).to be_invalid_with_errors(base: ["Skipped solves must all come at the end."])
    end

    it "cannot skip all solves" do
      result = build(:result, value1: -2, value2: -2, value3: 0, value4: 0, value5: 0, best: -2)
      expect(result).to be_invalid_with_errors(base: ["All solves cannot be DNS/skipped."])
    end

    it "values must all be >= -2" do
      result = build(:result, value1: 0, value2: -3, value3: 0, value4: 0, value5: 0)
      expect(result).not_to be_valid(value2: ["invalid"])
    end

    it "position must be a number" do
      result = build(:result, pos: nil)
      expect(result).not_to be_valid(pos: ["The position is not a valid number. Did you clear all the empty rows and synchronized WCA Live?"])
    end

    it "correctly computes best" do
      result = build(:result, value1: 42, value2: 43, value3: 44, value4: 45, value5: 46, best: 42, average: 44)
      expect(result).to be_valid

      result.best = 41
      expect(result).not_to be_valid(best: ["should be 42"])
    end

    context "correctly computes average" do
      context "333 average 5" do
        let(:event_id) { "333" }
        let(:format_id) { "a" }
        let(:competition) { create(:competition) }

        context "cutoff round" do
          let(:round_type_id) { "c" }
          let!(:round) { create(:round, competition: competition, cutoff: Cutoff.new(number_of_attempts: 2, attempt_result: 60 * 100)) }

          it "all solves" do
            result = build_result(value1: 42, value2: 43, value3: 44, value4: 45, value5: 46, best: 42, average: 44, round: round)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 44
            expect(result).not_to be_valid(average: ["should be 44"])
          end

          it "missing solves" do
            result = build_result(value1: 42, value2: 43, value3: 44, value4: 0, value5: 0, best: 42, average: 44, round: round)
            expect(result.average_is_not_computable_reason).to be_nil
            expect(result.compute_correct_average).to eq 0
            expect(result).not_to be_valid(average: ["should be 0"])
          end
        end

        context "uncutoff round" do
          let(:round_type_id) { "f" }
          let!(:round) { create(:round, competition: competition) }

          it "all solves with average below 10 minutes" do
            # This average computes to 44.0066... and should be rounded to 44.01
            result = build_result(value1: 4200, value2: 4300, value3: 4400, value4: 4502, value5: 4600, best: 4200, average: 4401, round: round)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 4401
            expect(result).to be_invalid_with_errors(average: ["must be equal to 4401"])
          end

          it "all solves with average above 10 minutes" do
            # This average computes to 600.66... and should be rounded to 601
            result = build_result(value1: 1001, value2: 60_100, value3: 60_100, value4: 60_000, value5: 70_000, best: 1001, average: 60_100, round: round)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 60_100
            expect(result).to be_invalid_with_errors(average: ["must be equal to 60100"])
          end

          it "DNF average" do
            result = build_result(value1: SolveTime::DNF_VALUE, value2: 43, value3: SolveTime::DNF_VALUE, value4: 45, value5: 46, best: 43, average: SolveTime::DNF_VALUE, round: round)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq SolveTime::DNF_VALUE
            expect(result).to be_invalid_with_errors(average: ["must be equal to -1"])
          end

          it "missing solves" do
            result = build_result(value1: 42, value2: 43, value3: 44, value4: 0, value5: 0, best: 42, average: 44, round: round)
            expect(result.average_is_not_computable_reason).to be_truthy
          end
        end
      end

      context "mean of 3" do
        let(:format_id) { "m" }

        context "777" do
          let(:event_id) { "777" }
          let(:competition) { create(:competition, event_ids: ["777"]) }

          context "cutoff round" do
            let(:round_type_id) { "c" }
            let!(:round) { create(:round, competition: competition, cutoff: Cutoff.new(number_of_attempts: 2, attempt_result: 60 * 100), format_id: "m", event_id: "777") }

            it "all solves" do
              result = build_result(value1: 42, value2: 43, value3: 44, value4: 0, value5: 0, best: 42, average: 43, round: round)
              expect(result).to be_valid

              result.average = 33
              expect(result.compute_correct_average).to eq 43
              expect(result).to be_invalid_with_errors(average: ["must be equal to 43"])
            end

            it "missing solves" do
              result = build_result(value1: 42, value2: 0, value3: 0, value4: 0, value5: 0, best: 42, average: 0, round: round)
              expect(result).to be_valid

              result.average = 33
              expect(result.compute_correct_average).to eq 0
              expect(result).to be_invalid_with_errors(average: ["must be equal to 0"])
            end

            it "too many solves" do
              result = build_result(value1: 42, value2: 43, value3: 44, value4: 45, value5: 46, best: 42, average: 43, round: round)
              expect(result.average_is_not_computable_reason).to be_truthy
              expect(result).to be_invalid_with_errors(base: ["Expected at most 3 solves, but found 5."])
            end
          end

          context "uncutoff round" do
            let(:round_type_id) { "f" }
            let!(:round) { create(:round, competition: competition, format_id: "m", event_id: "777") }

            it "all solves with average below 10 minutes" do
              # This average computes to 44.0066... and should be rounded to 44.01
              result = build_result(value1: 4300, value2: 4502, value3: 4400, value4: 0, value5: 0, best: 4300, average: 4401, round: round)
              expect(result).to be_valid

              result.average = 33
              expect(result.compute_correct_average).to eq 4401
              expect(result).to be_invalid_with_errors(average: ["must be equal to 4401"])
            end

            it "all solves with average above 10 minutes" do
              # This average computes to 600.66... and should be rounded to 601
              result = build_result(value1: 60_100, value2: 60_100, value3: 60_000, value4: 0, value5: 0, best: 60_000, average: 60_100, round: round)
              expect(result).to be_valid

              result.average = 33
              expect(result.compute_correct_average).to eq 60_100
              expect(result).to be_invalid_with_errors(average: ["must be equal to 60100"])
            end

            it "rounds instead of truncates" do
              result = build_result(value1: 4, value2: 4, value3: 3, value4: 0, value5: 0, best: 3, average: 4, round: round)
              expect(result).to be_valid

              result.average = 33
              expect(result.compute_correct_average).to eq 4
              expect(result).to be_invalid_with_errors(average: ["must be equal to 4"])
            end

            it "missing solves" do
              result = build_result(value1: 42, value2: 0, value3: 0, value4: 0, value5: 0, best: 42, average: 0, round: round)
              expect(result.average_is_not_computable_reason).to be_truthy
              expect(result).to be_invalid_with_errors(base: ["Expected 3 solves, but found 1."])
            end

            it "too many solves" do
              result = build_result(value1: 42, value2: 43, value3: 44, value4: 45, value5: 46, best: 42, average: 43, round: round)
              expect(result.average_is_not_computable_reason).to be_truthy
              expect(result).to be_invalid_with_errors(base: ["Expected 3 solves, but found 5."])
            end
          end
        end

        context "333fm uncutoff round" do
          let(:event_id) { "333fm" }
          let(:round_type_id) { "f" }
          let(:competition) { create(:competition, event_ids: ["333fm"]) }
          let!(:round) { create(:round, competition: competition, format_id: "m", event_id: "333fm") }

          it "correctly computes average" do
            result = build_result(value1: 42, value2: 42, value3: 43, value4: 0, value5: 0, best: 42, average: 4233, round: round)
            expect(result).to be_valid

            result.average = 4200
            expect(result.compute_correct_average).to eq 4233
            expect(result).to be_invalid_with_errors(average: ["must be equal to 4233"])
          end

          it "correctly computes DNF average" do
            result = build_result(value1: 42, value2: SolveTime::DNF_VALUE, value3: 44, value4: 0, value5: 0, best: 42, average: SolveTime::DNF_VALUE, round: round)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq(-1)
            expect(result).to be_invalid_with_errors(average: ["must be equal to -1"])
          end
        end
      end

      context "best of 3" do
        let(:round_type_id) { "f" }
        let(:competition) { create(:competition, event_ids: %w[333bf 444bf 555bf 333mbf 333ft 333fm]) }

        context "333bf" do
          let(:format_id) { "3" }
          let(:event_id) { "333bf" }
          let!(:round) { create(:round, competition: competition, event_id: "333bf", format_id: "3") }

          it "does compute average" do
            result = build_result(value1: 999, value2: 1000, value3: 1001, value4: 0, value5: 0, best: 999, average: 1000, round: round)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 1000
            expect(result).to be_invalid_with_errors(average: ["must be equal to 1000"])
          end

          it "leaves average for 333bf as skipped if one of three solves is skipped" do
            result = build_result(value1: 3000, value2: 3000,
                                  value3: SolveTime::SKIPPED_VALUE,
                                  value4: SolveTime::SKIPPED_VALUE,
                                  value5: SolveTime::SKIPPED_VALUE,
                                  round: round)
            expect(result.compute_correct_average).to eq SolveTime::SKIPPED_VALUE
          end

          it "sets DNF average for 333bf if one of three solves is either DNF or DNS" do
            result_dns = build_result(value1: 3000, value2: 3000,
                                      value3: SolveTime::DNS_VALUE,
                                      value4: SolveTime::SKIPPED_VALUE,
                                      value5: SolveTime::SKIPPED_VALUE, round: round)
            result_dnf = build_result(value1: 3000, value2: 3000,
                                      value3: SolveTime::DNF_VALUE,
                                      value4: SolveTime::SKIPPED_VALUE,
                                      value5: SolveTime::SKIPPED_VALUE, round: round)
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
                                  value5: SolveTime::SKIPPED_VALUE, round: round)
            expect(result.compute_correct_average).to eq((10.minutes + 10.seconds) * 100)
          end

          # https://www.worldcubeassociation.org/regulations/#9f2
          it "rounds averages for 333bf over 10 minutes up to nearest second for x.50" do
            over10 = (10.minutes + 10.50.seconds) * 100 # In centiseconds.
            result = build_result(value1: over10,
                                  value2: over10,
                                  value3: over10,
                                  value4: SolveTime::SKIPPED_VALUE,
                                  value5: SolveTime::SKIPPED_VALUE, round: round)
            expect(result.compute_correct_average).to eq((10.minutes + 11.seconds) * 100)
          end
        end

        context "444bf" do
          let(:format_id) { "3" }
          let(:event_id) { "444bf" }
          let!(:round) { create(:round, competition: competition, event_id: "444bf", format_id: "3") }

          it "sets a valid average for 444bf if all three solves are completed" do
            result = build_result(value1: 999, value2: 1000, value3: 1001, value4: 0, value5: 0, best: 999, average: 1000, round: round)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 1000
            expect(result).to be_invalid_with_errors(average: ["must be equal to 1000"])
          end
        end

        context "555bf" do
          let(:format_id) { "3" }
          let(:event_id) { "555bf" }
          let!(:round) { create(:round, competition: competition, event_id: "555bf", format_id: "3") }

          it "sets a valid average for 555bf if all three solves are completed" do
            result = build_result(value1: 999, value2: 1000, value3: 1001, value4: 0, value5: 0, best: 999, average: 1000, round: round)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 1000
            expect(result).to be_invalid_with_errors(average: ["must be equal to 1000"])
          end
        end

        context "333fm" do
          let(:format_id) { "m" }
          let(:event_id) { "333fm" }
          let!(:round) { create(:round, competition: competition, event_id: "333fm", format_id: "m") }

          it "does compute average" do
            result = build_result(value1: 24, value2: 25, value3: 26, value4: 0, value5: 0, best: 24, average: 2500, round: round)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 2500
            expect(result).to be_invalid_with_errors(average: ["must be equal to 2500"])
          end
        end

        context "333mbf" do
          let(:format_id) { "3" }
          let(:event_id) { "333mbf" }
          let!(:round) { create(:round, competition: competition, event_id: "333mbf", format_id: "3") }

          it "does not compute average" do
            solve_time = SolveTime.new("333mbf", :best, 0)
            solve_time.attempted = 9
            solve_time.solved = 8
            solve_time.time_centiseconds = (45.minutes + 32.seconds).in_centiseconds
            val = solve_time.wca_value

            result = build_result(value1: val, value2: val, value3: val, value4: 0, value5: 0, best: val, average: 0, round: round)
            expect(result).to be_valid

            result.average = 33
            expect(result.compute_correct_average).to eq 0
            expect(result).to be_invalid_with_errors(average: ["must be equal to 0"])
          end
        end
      end
    end

    context "check number of non-zero solves" do
      def result_with_n_solves(n, **)
        result_attempts = (1..5).to_h do |i|
          [:"value#{i}", i <= n ? 42 : 0]
        end
        build(:result, **, **result_attempts)
      end

      context "non-cutoff rounds" do
        it "format 1" do
          result = result_with_n_solves(2, round_type_id: "1", format_id: "1", event_id: "333mbf")
          expect(result).to be_invalid_with_errors(base: ["Expected 1 solve, but found 2."])
        end

        it "format 2" do
          result = result_with_n_solves(3, round_type_id: "1", format_id: "2", event_id: "333mbf")
          expect(result).to be_invalid_with_errors(base: ["Expected 2 solves, but found 3."])
        end

        it "format 3" do
          result = result_with_n_solves(2, round_type_id: "1", format_id: "3", event_id: "333bf")
          expect(result).to be_invalid_with_errors(base: ["Expected 3 solves, but found 2."])
        end

        it "format m" do
          result = result_with_n_solves(2, round_type_id: "1", format_id: "m", event_id: "333fm")
          expect(result).to be_invalid_with_errors(base: ["Expected 3 solves, but found 2."])
        end

        it "format a" do
          result = result_with_n_solves(2, round_type_id: "1", format_id: "a")
          expect(result).to be_invalid_with_errors(base: ["Expected 5 solves, but found 2."])
        end
      end

      context "cutoff rounds" do
        it "format 2" do
          result = result_with_n_solves(3, round_type_id: "c", format_id: "2", event_id: "333mbf")
          expect(result).to be_invalid_with_errors(base: ["Expected at most 2 solves, but found 3."])
        end

        it "format 3" do
          result = result_with_n_solves(4, round_type_id: "c", format_id: "3", event_id: "333bf")
          expect(result).to be_invalid_with_errors(base: ["Expected at most 3 solves, but found 4."])
        end

        it "format m" do
          result = result_with_n_solves(4, round_type_id: "c", format_id: "m", event_id: "777")
          expect(result).to be_invalid_with_errors(base: ["Expected at most 3 solves, but found 4."])
        end
      end
    end

    it "times over 10 minutes must be rounded" do
      expect(build(:result, value2: (10 * 6000) + 4343)).to be_invalid_with_errors(value2: ["times over 10 minutes should be rounded"])
      expect(build(:result, value2: (10 * 6000) + 4300)).to be_valid
    end

    context "multibld" do
      # Enforce https://www.worldcubeassociation.org/regulations/#H1b.
      it "time must be below one hour" do
        solve_time = SolveTime.new("333mbf", :single, 0)
        solve_time.solved = 28
        solve_time.attempted = 30
        solve_time.time_centiseconds = 65 * 60 * 100

        result = build(:result, event_id: "333mbf", value1: solve_time.wca_value, format_id: "1")
        expect(result).to be_invalid_with_errors(value1: ["should be less than or equal to 60 minutes"])
      end

      it "time must be below 30 minutes if they attempted 3 cubes" do
        solve_time = SolveTime.new("333mbf", :single, 0)
        solve_time.solved = 2
        solve_time.attempted = 3
        solve_time.time_centiseconds = 32 * 60 * 100

        result = build(:result, event_id: "333mbf", value1: solve_time.wca_value, format_id: "1")
        expect(result).to be_invalid_with_errors(value1: ["should be less than or equal to 30 minutes"])
      end
    end
  end
end

def build_result(attrs)
  FactoryBot.build(:result, { competition: competition, round_type_id: round_type_id, format_id: format_id, event_id: event_id }.merge(attrs))
end

def solve_time(centis)
  SolveTime.new("333", :single, centis)
end
