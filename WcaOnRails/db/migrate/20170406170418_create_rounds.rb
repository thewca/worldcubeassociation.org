# frozen_string_literal: true

class CreateRounds < ActiveRecord::Migration[5.0]
  def change
    create_table :rounds do |t|
      t.integer :competition_event_id, null: false
      t.string :format_id, null: false
      t.integer :number, null: false

      t.timestamps null: false
    end

    add_index :rounds, [:competition_event_id, :number]
  end
end
