# frozen_string_literal: true

class CreateResultValuesTable < ActiveRecord::Migration[7.2]
  def change
    create_table :auxiliary_result_attempts do |t|
      t.references :result, type: :integer, null: false, foreign_key: { to_table: :Results }
      t.integer :idx, null: false
      t.integer :value, null: false

      t.index :value
    end
  end
end
