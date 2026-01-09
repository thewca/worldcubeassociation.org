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

  context "Duplicate Results" do
    it "Correctly finds duplicate results" do
      sanity_check = SanityCheck.find(18)
      competition = create(:competition)
      round = create(:round, competition: competition)
      create(:result, competition: competition, round: round, event_id: "333",
             value1: 100, value2: 100, value3: 100, value4: 100, value5: 100, average: 100, best: 100)
      create(:result, competition: competition, round: round, event_id: "333",
             value1: 100, value2: 100, value3: 100, value4: 100, value5: 100, average: 100, best: 100)

      result_ids = sanity_check.run_query.pluck("competitions")
      expect(result_ids).to contain_exactly(competition.id)
    end
  end

  context "Person Data Irregularities" do
    context "Wrong names" do
      RSpec.shared_examples 'correct sanity check' do |sanity_check, irregular_people, valid_people|
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
        it_behaves_like 'correct sanity check', SanityCheck.find(params[:id]), params[:irregular_people], params[:valid_people]
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
