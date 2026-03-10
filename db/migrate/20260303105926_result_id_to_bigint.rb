# frozen_string_literal: true

class ResultIdToBigint < ActiveRecord::Migration[8.1]
  def change
    remove_foreign_key :regional_records_lookup, :results

    reversible do |dir|
      dir.up do
        change_column :regional_records_lookup, :result_id, :bigint
        change_column :results, :id, :bigint
      end

      dir.down do
        change_column :regional_records_lookup, :result_id, :integer
        change_column :results, :id, :integer
      end
    end

    add_foreign_key :regional_records_lookup, :results, on_update: :cascade, on_delete: :cascade
  end
end
