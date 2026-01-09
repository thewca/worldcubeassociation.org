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

      it "Correctly find irregular results" do
        mo3_with_missing = create(:result, :mo3, event_id: "666")
        mo3_with_missing.update_columns(value3: 0)

        bo5_with_missing = create(:result)
        bo5_with_missing.update_columns(value5: 0)

        result_ids = sanity_check.run_query.pluck("result_id")

        expect(result_ids).to match_array([mo3_with_missing, bo5_with_missing].map(&:id))
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
end
