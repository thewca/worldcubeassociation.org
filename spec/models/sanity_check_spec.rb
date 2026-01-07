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
    RSpec.shared_examples 'correct sanity check' do |sanity_check, irregular_people, valid_people|
      context sanity_check.topic.to_s do
        it "correctly finds all irregular names" do
          irregular_people = irregular_people.map do |name|
            create(:person, name: name)
          end
          result_ids = run_query(sanity_check.query).pluck("id")

          expect(result_ids).to match_array(irregular_people.map(&:id))
        end

        it "does not flag valid names" do
          valid_people = valid_people.map do |name|
            create(:person, name: name)
          end
          result_ids = run_query(sanity_check.query).to_a

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
      ], valid_people: [
        "Jane Doe",
      ] },
      { id: 2, irregular_people: [
        "john Doe",
      ], valid_people: [
        "Jane Doe",
      ] },
      { id: 3, irregular_people: [
        "John doe",
      ], valid_people: [
        "Jane Doe",
      ] },
      { id: 4, irregular_people: [
        "John doe (黄)",
      ], valid_people: [
        "John Doe (黄)",
      ] },
      { id: 5, irregular_people: [
        "John doe (abc)",
        "John doe (a黄)",
      ], valid_people: [
        "John Doe (黄)",
      ] },
      { id: 6, irregular_people: [
        "John doe (黄",
      ], valid_people: [
        "John Doe (黄)",
      ] },
      { id: 7,  irregular_people: [], valid_people: [] },
      { id: 8,  irregular_people: [], valid_people: [] },
      { id: 9,  irregular_people: [], valid_people: [] },
      { id: 10, irregular_people: [], valid_people: [] },
      { id: 11, irregular_people: [], valid_people: [] },
      { id: 12, irregular_people: [], valid_people: [] },
      { id: 61, irregular_people: [], valid_people: [] },
      { id: 62, irregular_people: [], valid_people: [] },
      { id: 67, irregular_people: [], valid_people: [] },
    ].each do |params|
      it_behaves_like 'correct sanity check', SanityCheck.find(params[:id]), params[:irregular_people], params[:valid_people]
    end
  end

  def run_query(query)
    ActiveRecord::Base.connection.exec_query(query)
  end
end
