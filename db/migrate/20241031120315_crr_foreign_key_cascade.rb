# frozen_string_literal: true

class CrrForeignKeyCascade < ActiveRecord::Migration[7.2]
  def change
    remove_foreign_key :regional_records_lookup, :Results
    add_foreign_key :regional_records_lookup, :Results, column: :resultId, on_update: :cascade, on_delete: :cascade
  end
end
