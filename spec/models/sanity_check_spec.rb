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

      expect(result_ids).to contain_exactly([302,300,300])
    end

    it "Correctly identifies timelimit violations (cumulative), single round" do
      sanity_check = SanityCheck.find(49)
      competition = create(:competition, event_ids: ["666"])
      round = create(:round, competition: competition, event_id: "666", format_id: "m")
      time_limit = TimeLimit.new(centiseconds: 901, cumulative_round_ids: [round.id])
      round.update(time_limit: time_limit)
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
      round1 = create(:round, competition: competition, event_id: "666", format_id: "m")
      round2 = create(:round, competition: competition, event_id: "666", format_id: "m", number: 2)
      time_limit = TimeLimit.new(centiseconds: 1801, cumulative_round_ids: [round1.id, round2.id])
      round1.update(time_limit: time_limit)
      round2.update(time_limit: time_limit)
      create(:result, competition: competition, round: round1,
                      value1: 300, value2: 300, value3: 300, value4: 0, value5: 0,
                      event_id: "666", format_id: "m", round_type_id: "f",
                      average: 300, best: 300)
      result = create(:result, competition: competition, round: round1,
                      value1: 300, value2: 300, value3: 300, value4: 0, value5: 0,
                      event_id: "666", format_id: "m", round_type_id: "f",
                      average: 300, best: 300)

      # Apply Timelimit violations
      result.update_columns(value1: 302)

      result_ids = sanity_check.run_query.pluck("sumOfSolves")

      expect(result_ids).to contain_exactly(1801)
    end
  end
end
