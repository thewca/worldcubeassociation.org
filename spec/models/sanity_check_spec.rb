# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SanityCheck do
  context "SQL Files" do
    it "can read all files" do
      SanityCheck.find_each do |sanity_check|
        expect { sanity_check.query }.not_to raise_error
        expect(sanity_check.query.presence).not_to be_nil
      end
    end

    it "can (potentially) execute all queries" do
      SanityCheck.find_each do |sanity_check|
        original_query = sanity_check.query
        # We prefix an `EXPLAIN` to skip actually executing the query,
        #   but still force the SQL server to _fully parse_ it and see whether it contains syntactic mistakes.
        # This is a "smoke test" to prevent deprecated `SELECT * FROM Results` (note the uppercase R)
        #   from slipping through. The actual data / semantics of the queries are tested elsewhere.
        explain_query = "EXPLAIN #{original_query}"

        expect { ActiveRecord::Base.connection.execute explain_query }.not_to raise_error
      end
    end

    it "references all SQL files that are in the sanity_check_sql folder" do
      # `pluck` does not work here because `query` is not a DB column!
      used_queries = SanityCheck.all.map(&:query)

      sc_folder = Rails.root.join("lib/sanity_check_sql")
      sql_files = sc_folder.glob('**/*.sql')

      stored_queries = sql_files.map(&:read)

      expect(stored_queries).to match_array(used_queries)
    end
  end

  context "Consistency of Results and Rounds Data" do
    it "Correctly identifies cutoff violations" do
      sanity_check = SanityCheck.find(47)
      competition = create(:competition, event_ids: ["666"])
      cutoff = Cutoff.new(number_of_attempts: 1, attempt_result: 300)
      round = create(:round, competition: competition, event_id: "666", cutoff: cutoff, format_id: "m")
      result = create(:result, competition: competition, round: round,
                               value1: 299, value2: 300, value3: 300, value4: 0, value5: 0,
                               event_id: "666", format_id: "m", round_type_id: "c",
                               average: 300, best: 299)

      # Apply Cutoff violations
      result.update_columns(value1: 300, best: 300)

      result_ids = sanity_check.run_query.pluck("attemptResult")

      expect(result_ids).to contain_exactly("300")
    end

    it "Correctly identifies timelimit violations (non cumulative)" do
      sanity_check = SanityCheck.find(48)
      competition = create(:competition, event_ids: ["666"])
      time_limit = TimeLimit.new(centiseconds: 301)
      round = create(:round, competition: competition, event_id: "666", time_limit: time_limit, format_id: "m")
      result = create(:result, competition: competition, round: round,
                               value1: 300, value2: 300, value3: 300, value4: 0, value5: 0,
                               event_id: "666", format_id: "m", round_type_id: "f",
                               average: 300, best: 300)

      # Apply Timelimit violations
      result.update_columns(value1: 302)

      result_ids = sanity_check.run_query.pluck("value1", "value2", "value3")

      expect(result_ids).to contain_exactly([302, 300, 300])
    end

    it "Correctly identifies timelimit violations (cumulative), single round" do
      sanity_check = SanityCheck.find(48)
      competition = create(:competition, event_ids: ["666"])
      round = create(:round, competition: competition, event_id: "666", format_id: "m")
      time_limit = TimeLimit.new(centiseconds: 901, cumulative_round_ids: [round.wcif_id])
      round.update!(time_limit: time_limit)
      result = create(:result, competition: competition, round: round,
                               value1: 300, value2: 300, value3: 300, value4: 0, value5: 0,
                               event_id: "666", format_id: "m", round_type_id: "f",
                               average: 300, best: 300)

      # Apply Timelimit violations
      result.update_columns(value1: 302)

      result_ids = sanity_check.run_query.pluck("sumOfSolves")

      expect(result_ids).to contain_exactly(902)
    end

    it "Correctly identifies timelimit violations (cumulative), across rounds" do
      sanity_check = SanityCheck.find(49)
      competition = create(:competition, event_ids: ["666"])
      round1 = create(:round, competition: competition, event_id: "666", format_id: "m", total_number_of_rounds: 2)
      round2 = create(:round, competition: competition, event_id: "666", format_id: "m", number: 2)
      time_limit = TimeLimit.new(centiseconds: 1801, cumulative_round_ids: [round1.wcif_id, round2.wcif_id])
      person = create(:person)
      round1.update!(time_limit: time_limit)
      round2.update!(time_limit: time_limit)
      create(:result, competition: competition, round: round1,
                      value1: 300, value2: 300, value3: 300, value4: 0, value5: 0,
                      event_id: "666", format_id: "m", round_type_id: 1,
                      average: 300, best: 300, person: person)
      result = create(:result, competition: competition, round: round2,
                               value1: 300, value2: 300, value3: 300, value4: 0, value5: 0,
                               event_id: "666", format_id: "m", round_type_id: "f",
                               average: 300, best: 300, person: person)

      # Apply Timelimit violations
      result.update_columns(value1: 302)

      result_ids = sanity_check.run_query.pluck("sumOfSolves")

      expect(result_ids).to contain_exactly(1802)
    end
  end

  context "Duplicate_scrambles" do
    it "Duplicate Scrambles within competition id" do
      sanity_check = SanityCheck.find(20)
      competition = create(:competition)
      round1 = create(:round, competition: competition)
      round2 = create(:round, competition: competition, number: 2)
      create(:scramble, competition: competition, round: round1, scramble: "F2 B2")
      create(:scramble, competition: competition, round: round2, scramble: "F2 B2")

      result_ids = sanity_check.run_query.pluck("competition_id")

      expect(result_ids).to contain_exactly(competition.id)
    end

    it "Duplicate Scrambles within same round" do
      sanity_check = SanityCheck.find(20)
      competition = create(:competition)
      round = create(:round, competition: competition)
      create(:scramble, competition: competition, round: round, scramble: "F2 B2")
      create(:scramble, competition: competition, round: round, scramble: "F2 B2")

      result_ids = sanity_check.run_query.pluck("competition_id")

      expect(result_ids).to contain_exactly(competition.id)
    end

    it "Duplicate Scrambles across competition" do
      sanity_check = SanityCheck.find(21)
      competition_1 = create(:competition)
      competition_2 = create(:competition)
      create(:scramble, competition: competition_1, scramble: "F2 B2")
      create(:scramble, competition: competition_2, scramble: "F2 B2")

      result_ids = sanity_check.run_query.pluck("competitions")

      expect(result_ids).to contain_exactly([competition_1.id, competition_2.id].join(","))
    end
  end

  context "Duplicate Results" do
    let!(:sanity_check) { SanityCheck.find(18) }

    it "Correctly finds duplicate results" do
      competition = create(:competition)
      round = create(:round, competition: competition)
      create(:result, competition: competition, round: round, event_id: "333",
                      value1: 100, value2: 200, value3: 300, value4: 400, value5: 500, average: 300, best: 100)
      create(:result, competition: competition, round: round, event_id: "333",
                      value1: 100, value2: 200, value3: 300, value4: 400, value5: 500, average: 300, best: 100)

      result_ids = sanity_check.run_query.pluck("competitions")
      expect(result_ids).to contain_exactly(competition.id)
    end

    it "Doesn't trigger for fmc or multiblind old style" do
      competition = create(:competition, event_ids: ["333fm"])
      round = create(:round, competition: competition, event_id: "333fm", format_id: "m")
      create(:result, competition: competition, round: round, event_id: "333fm",
                      value1: 21, value2: 22, value3: 23, value4: 0, value5: 0, best: 21, average: 2200, format_id: "m")
      create(:result, competition: competition, round: round, event_id: "333fm",
                      value1: 21, value2: 22, value3: 23, value4: 0, value5: 0, best: 21, average: 2200, format_id: "m")

      # Currently getting the error: Validation failed: Format '1' is not allowed for '333mbo'
      # But it should be allowed according to events.json?
      # competition = create(:competition, event_ids: ["333mbo"])
      # round = create(:round, competition: competition, event_id: "333mbo", format_id: "1")
      # create(:result, competition: competition, round: round, event_id: "333mbo",
      #                 value1: 21, value2: 0, value3: 0, value4: 0, value5: 0, best: 21, average: 2200, format_id: "1")
      # create(:result, competition: competition, round: round, event_id: "333mbo",
      #                 value1: 21, value2: 0, value3: 0, value4: 0, value5: 0, best: 21, average: 2200, format_id: "1")

      result_ids = sanity_check.run_query.pluck("competitions")
      expect(result_ids).to be_empty
    end
  end

  context "WCA Id Irregularities" do
    it "Correctly finds year not matching to first competition year" do
      sanity_check = SanityCheck.find(19)
      person = create(:person)
      person.update_columns(wca_id: "1982TEST01")
      # This sanity check uses start_date, not competition_id to check for year
      competition = create(:competition, start_date: Date.new(1983, 1, 1), end_date: Date.new(1983, 1, 1))
      create(:result, person: person, competition: competition)
      result_ids = sanity_check.run_query.pluck("person_id")

      expect(result_ids).to contain_exactly(person.wca_id)
    end
  end

  context "Irregular Results" do
    context "no first solve" do
      let(:sanity_check) { SanityCheck.find(13) }

      it "Correctly find irregular results" do
        r = create(:result)
        r.update_columns(value1: 0)

        result_ids = sanity_check.run_query.pluck("id")

        expect(result_ids).to contain_exactly(r.id)
      end
    end

    context "wrong number of results" do
      let(:sanity_check) { SanityCheck.find(14) }

      it "Correctly find less than needed attempts" do
        mo3_with_missing = create(:result, :mo3, event_id: "666")
        mo3_with_missing.update_columns(value3: 0)

        bo5_with_missing = create(:result)
        bo5_with_missing.update_columns(value5: 0)

        result_ids = sanity_check.run_query.pluck("result_id")

        expect(result_ids).to match_array([mo3_with_missing, bo5_with_missing].map(&:id))
      end

      it "Correctly find more than needed attempts" do
        mo3_with_additional = create(:result, :mo3, event_id: "666")
        mo3_with_additional.update_columns(value4: 300)

        result_ids = sanity_check.run_query.pluck("result_id")

        expect(result_ids).to match_array([mo3_with_additional].map(&:id))
      end
    end

    context "different result types" do
      let(:sanity_check) { SanityCheck.find(15) }

      it "Correctly find irregular results" do
        competition1 = create(:competition, event_ids: ["666"])
        round1 = create(:round, competition: competition1, event_id: "666", format_id: "m")
        competition2 = create(:competition)
        round2 = create(:round, competition: competition2, event_id: "333oh")

        mo3_with_missing = create(:result, :mo3, event_id: "666", round: round1, competition: competition1)
        mo3_with_missing.update_columns(value3: 0)
        create(:result, :mo3, event_id: "666", round: round1, competition: competition1)

        bo5_with_missing = create(:result, round: round2, competition: competition2)
        bo5_with_missing.update_columns(value5: 0)
        create(:result, round: round2, competition: competition2)

        result_ids = sanity_check.run_query.pluck("competition_id")

        expect(result_ids).to match_array([mo3_with_missing, bo5_with_missing].map(&:competition_id))
      end
    end

    context "only dns results" do
      let(:sanity_check) { SanityCheck.find(16) }

      it "Correctly find irregular results" do
        r = create(:result)
        r.update_columns(value1: -2, value2: -2, value3: -2, value4: -2, value5: -2)

        result_ids = sanity_check.run_query.pluck("id")

        expect(result_ids).to contain_exactly(r.id)
      end
    end

    context "non-zero average for less than 3 results" do
      let(:sanity_check) { SanityCheck.find(17) }

      it "Correctly find irregular results" do
        r = create(:result)
        r.update_columns(value3: 0, value4: 0, value5: 0)

        result_ids = sanity_check.run_query.pluck("id")

        expect(result_ids).to contain_exactly(r.id)
      end
    end
  end

  context "Person Data Irregularities" do
    context "Wrong names" do
      RSpec.shared_examples 'correct sanity check' do |sanity_check_id, irregular_people, valid_people|
        sanity_check = SanityCheck.find(sanity_check_id)
        context sanity_check.topic.to_s do
          it "correctly finds all irregular names" do
            irregular_people = irregular_people.map do |name|
              create(:person, name: name)
            end
            result_ids = sanity_check.run_query.pluck("id")

            expect(result_ids).to match_array(irregular_people.map(&:id))
          end

          it "does not flag valid names" do
            valid_people = valid_people.map do |name|
              create(:person, name: name)
            end
            result_ids = sanity_check.run_query.to_a

            expect(result_ids & valid_people.map(&:id)).to be_empty
          end
        end
      end

      [
        { id: 1, irregular_people: [
          "0",
          "John1",
          "Jane_Doe",
          "Alice@Wonderland",
          "Bob#Builder",
          "Back`Tick",
          "Cash$Money",
          "Caret^Top",
          "Amp&Sand",
          "Pipe|Name",
          "Brace{Name}",
          "Bracket[Name]",
          "Plus+Minus",
          "Equals=Name",
          "Question?Mark",
          "Greater>Less<",
          "Comma,Name",
          "Tilde~Name",
          'Quote"Name',
          "Back\\Slash",
        ], valid_people: ["Jane Doe"] },
        { id: 2, irregular_people: ["john Doe"], valid_people: ["Jane Doe"] },
        { id: 3, irregular_people: ["John doe"], valid_people: ["Jane Doe"] },
        { id: 4, irregular_people: ["John doe (黄)"], valid_people: ["John Doe (黄)"] },
        { id: 5, irregular_people: ["John Doe (abc)", "John doe (a黄)"], valid_people: ["John Doe (黄)"] },
        { id: 6, irregular_people: ["John Doe (黄"], valid_people: ["John Doe (黄)"] },
        { id: 7, irregular_people: [
          "John Doe (黄) ",
          "John Doe ",
          " John Doe",
          "John Doe (黄 )",
          "John Doe ( 黄)",
        ], valid_people: ["Jane Doe"] },
        { id: 8,  irregular_people: ["д (John)", "β (Jane)"], valid_people: ["Ja Do (ณั)", "Ja Do (黄)", "Jo Do (文)", "Ja Do (혁)", "Jo Do (星)"] },
        { id: 61, irregular_people: ["J. Doe"], valid_people: ["Jane Doe"] },
        { id: 62, irregular_people: ["Jooon Doe"], valid_people: ["Jane Doe III."] },
        { id: 67, irregular_people: ["J.Doe"], valid_people: ["Jane d. Doe"] },
      ].each do |params|
        it_behaves_like 'correct sanity check', params[:id], params[:irregular_people], params[:valid_people]
      end
    end

    context "Wrong Attributes" do
      context "Missing Gender" do
        let(:sanity_check) { SanityCheck.find(9) }

        it "correctly finds all missing genders" do
          # Use update_columns to force not using validations
          person1 = create(:person)
          person1.update_columns(gender: '')
          irregular_people = [person1]
          result_ids = sanity_check.run_query.pluck("id")

          expect(result_ids).to match_array(irregular_people.map(&:id))
        end

        it "doesn't flag valid genders" do
          valid_people = [create(:user)]
          result_ids = sanity_check.run_query.to_a

          expect(result_ids & valid_people.map(&:id)).to be_empty
        end
      end

      context "Invalid Country Ids" do
        let(:sanity_check) { SanityCheck.find(10) }

        it "correctly finds all missing country_ids" do
          # Use update_columns to force not using validations
          person1 = create(:person)
          person1.update_columns(country_id: 'BLAH')
          irregular_people = [person1]
          result_ids = sanity_check.run_query.pluck("wca_id")

          expect(result_ids).to match_array(irregular_people.map(&:wca_id))
        end

        it "doesn't flag valid country ids" do
          valid_people = [create(:person)]
          result_ids = sanity_check.run_query.to_a

          expect(result_ids & valid_people.map(&:id)).to be_empty
        end
      end

      context "Invalid Dobs" do
        let(:sanity_check_11) { SanityCheck.find(11) }
        let(:sanity_check_12) { SanityCheck.find(12) }

        it "correctly finds all bogus dobs" do
          competition = create(:competition)
          round = create(:round, competition: competition)
          irregular_person_1 = create(:person, dob: Date.new(1800, 1, 1))
          irregular_person_2 = create(:person, dob: Date.new(2024, 1, 1))
          create(:result, person: irregular_person_1, competition: competition, round: round, event_id: "333")
          create(:result, person: irregular_person_2, competition: competition, round: round, event_id: "333")

          result_ids = sanity_check_11.run_query.pluck("person_id")

          expect(result_ids).to contain_exactly(irregular_person_1.wca_id, irregular_person_2.wca_id)
        end

        it "correctly finds all missing dobs" do
          # The sanity check only works on competition after 2018 and uses the year part of the id to check
          competition = create(:competition, id: "FooComp2025")
          round = create(:round, competition: competition)
          [1, 2, 3, 4].each do
            person = create(:person)
            # Use update_columns to force not using validations
            person.update_columns(dob: nil)
            create(:result, person: person, competition: competition, round: round, event_id: "333")
          end
          result_ids = sanity_check_12.run_query.pluck("competition_id")

          expect(result_ids).to contain_exactly(competition.id)
        end
      end
    end
  end
end
