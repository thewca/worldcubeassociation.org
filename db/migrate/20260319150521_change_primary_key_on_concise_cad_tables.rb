# frozen_string_literal: true

class ChangePrimaryKeyOnConciseCadTables < ActiveRecord::Migration[8.1]
  def change
    reversible do |dir|
      dir.up do
        change_column :concise_single_results, :id, :primary_key, null: true, default: nil
        change_column :concise_average_results, :id, :primary_key, null: true, default: nil
      end

      dir.down do
        change_column :concise_single_results, :id, :integer, null: false, default: 0
        change_column :concise_average_results, :id, :integer, null: false, default: 0
      end
    end

    rename_column :concise_single_results, :id, :result_id
    rename_column :concise_average_results, :id, :result_id

    add_foreign_key :concise_single_results, :results, on_update: :cascade, on_delete: :cascade
    add_foreign_key :concise_average_results, :results, on_update: :cascade, on_delete: :cascade
  end
end
