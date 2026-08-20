# frozen_string_literal: true

class AddLiveResultsHistoryTable < ActiveRecord::Migration[8.1]
  def change
    create_table :live_result_history_entries do |t|
      t.references :live_result, null: false, foreign_key: { on_delete: :cascade }
      t.datetime :entered_at, null: false
      t.references :entered_by, foreign_key: { to_table: :users }
      t.string :action_source, null: false
      t.string :action_type
      t.json :attempt_details
      t.text :comment
      t.timestamps
    end
  end
end
