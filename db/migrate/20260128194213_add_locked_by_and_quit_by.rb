# frozen_string_literal: true

class AddLockedByAndQuitBy < ActiveRecord::Migration[8.1]
  def change
    change_table :live_results, bulk: true do |t|
      t.references :quit_by, type: :integer, foreign_key: { to_table: :users }
      t.references :locked_by, type: :integer, foreign_key: { to_table: :users }
    end
  end
end
