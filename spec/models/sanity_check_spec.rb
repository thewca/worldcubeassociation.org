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

  context "Duplicate_scrambles" do
    it "Duplicate Scrambles within competition id" do
      sanity_check = SanityCheck.find(20)
      competition = create(:competition)
      round = create(:round, competition: competition)
      create(:scramble, competition: competition, round: round)
      create(:scramble, competition: competition, round: round)

      result_ids = sanity_check.run_query.pluck("competition_id")

      expect(result_ids).to match_array([competition.id])
    end

    it "Duplicate Scrambles across competition" do
      sanity_check = SanityCheck.find(21)
      competition_1 = create(:competition)
      competition_2 = create(:competition)
      create(:scramble, competition: competition_1)
      create(:scramble, competition: competition_2)

      result_ids = sanity_check.run_query.pluck("competition_id")

      expect(result_ids).to match_array([competition_1.id, competition_2.id])
    end
  end
end
