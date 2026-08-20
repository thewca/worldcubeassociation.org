# frozen_string_literal: true

class AddLatestResultsId < ActiveRecord::Migration[8.1]
  def change
    change_table :sanity_checks, bulk: true do |t|
      t.references :latest_result, foreign_key: { to_table: :sanity_check_results }
    end
  end
end
