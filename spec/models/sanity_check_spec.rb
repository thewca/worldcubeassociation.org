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
end
