# frozen_string_literal: true

class CreateChampionships < ActiveRecord::Migration[5.0]
  def change
    create_table :championships do |t|
      t.string :competition_id, null: false
      t.string :championship_type, index: true, null: false
    end
    add_index :championships, [:competition_id, :championship_type], unique: true
  end
end
