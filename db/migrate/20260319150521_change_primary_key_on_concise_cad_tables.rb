# frozen_string_literal: true

class ChangePrimaryKeyOnConciseCadTables < ActiveRecord::Migration[8.1]
  def change
    reversible do |dir|
      dir.up do
        change_column :concise_single_results, :id, :primary_key
        change_column :concise_average_results, :id, :primary_key
      end

      dir.down do
        change_column :concise_single_results, :id, :integer
        change_column :concise_average_results, :id, :integer
      end
    end

    rename_column :concise_single_results, :id, :result_id
    rename_column :concise_average_results, :id, :result_id

    add_foreign_key :concise_single_results, :results, on_update: :cascade, on_delete: :cascade
    add_foreign_key :concise_average_results, :results, on_update: :cascade, on_delete: :cascade
  end
end
