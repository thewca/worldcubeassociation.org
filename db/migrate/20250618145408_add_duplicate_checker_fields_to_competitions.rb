# frozen_string_literal: true

class AddDuplicateCheckerFieldsToCompetitions < ActiveRecord::Migration[7.2]
  def change
    change_table :competitions, bulk: true do |t|
      t.column :duplicate_checker_last_fetch_status, :integer, default: Competition.duplicate_checker_last_fetch_statuses[:not_fetched], null: false
      t.column :duplicate_checker_last_fetch_time, :datetime, null: true
    end
  end
end
