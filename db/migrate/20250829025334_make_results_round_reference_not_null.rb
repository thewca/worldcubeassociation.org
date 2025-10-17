# frozen_string_literal: true

class MakeResultsRoundReferenceNotNull < ActiveRecord::Migration[7.2]
  def change
    change_column_null :results, :round_id, false
    change_column_null :inbox_results, :round_id, false
  end
end
