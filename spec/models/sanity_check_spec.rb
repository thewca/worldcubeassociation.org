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

  context "Person Data Irregularities" do
    context "Names with numbers or non-desired special characters" do
      let(:query) { SanityCheck.find(1).query }

      def run_query
        ActiveRecord::Base.connection.exec_query(query)
      end

      it "correctly finds all irregular names" do
        irregular_people = [
          create(:person, name: "0"),
          create(:person, name: "John1"),
          create(:person, name: "Jane_Doe"),
          create(:person, name: "Alice@Wonderland"),
          create(:person, name: "Bob#Builder"),
          create(:person, name: "Back`Tick"),
          create(:person, name: "Cash$Money"),
          create(:person, name: "Caret^Top"),
          create(:person, name: "Amp&Sand"),
          create(:person, name: "Pipe|Name"),
          create(:person, name: "Brace{Name}"),
          create(:person, name: "Bracket[Name]"),
          create(:person, name: "Plus+Minus"),
          create(:person, name: "Equals=Name"),
          create(:person, name: "Question?Mark"),
          create(:person, name: "Greater>Less<"),
          create(:person, name: "Comma,Name"),
          create(:person, name: "Tilde~Name"),
          create(:person, name: %q(Quote"Name)),
          create(:person, name: "Back\\Slash")
        ]

        result_ids = run_query.map { |r| r["id"] }

        expect(result_ids).to match_array(irregular_people.map(&:id))
      end

      it "does not flag valid names" do
        valid_people = [
          create(:person, name: "John"),
          create(:person, name: "Jane Doe"),
          create(:person, name: "Mary-Jane"),
          create(:person, name: "Jean Luc"),
          create(:person, name: "OConnor"),
          create(:person, name: "Anne-Marie")
        ]

        result_ids = run_query.to_a

        expect(result_ids & valid_people.map(&:id)).to be_empty
      end
    end

    context "Lower Case First Name" do
      let(:query) { SanityCheck.find(2).query }

      def run_query
        ActiveRecord::Base.connection.exec_query(query)
      end

      it "correctly finds all irregular names" do
        irregular_people = [
          create(:person, name: "john Doe"),
        ]

        result_ids = run_query.map { |r| r["id"] }

        expect(result_ids).to match_array(irregular_people.map(&:id))
      end

      it "does not flag valid names" do
        valid_people = [
          create(:person, name: "John Doe"),
        ]

        result_ids = run_query.to_a

        expect(result_ids & valid_people.map(&:id)).to be_empty
      end
    end
  end
end
