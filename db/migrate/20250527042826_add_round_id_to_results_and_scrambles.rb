# frozen_string_literal: true

class AddRoundIdToResultsAndScrambles < ActiveRecord::Migration[7.2]
  def change
    add_reference :results, :round, type: :integer, after: :round_type_id, foreign_key: true
    add_reference :inbox_results, :round, type: :integer, after: :round_type_id, foreign_key: true
    add_reference :scrambles, :round, type: :integer, after: :round_type_id, foreign_key: true
  end
end
