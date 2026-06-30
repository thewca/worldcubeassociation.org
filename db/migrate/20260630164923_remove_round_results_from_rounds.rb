# frozen_string_literal: true

class RemoveRoundResultsFromRounds < ActiveRecord::Migration[8.1]
  def change
    remove_column :rounds, :round_results, :text, size: :medium
  end
end
