# frozen_string_literal: true

class AddRoundIdToResultsAndScrambles < ActiveRecord::Migration[7.2]
  def change
    add_reference :inbox_results, :round, type: :integer, after: :round_type_id, foreign_key: true

    # We don't generate a foreign key for these tables straight away, because it would be too costly due to table size
    add_reference :results, :round, type: :integer, after: :round_type_id
    add_reference :scrambles, :round, type: :integer, after: :round_type_id
  end
end
