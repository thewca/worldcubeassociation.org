# frozen_string_literal: true

class AddMatchedScramblesTables < ActiveRecord::Migration[8.1]
  def change
    create_table :matched_scramble_sets do |t|
      t.references :round, null: false, index: true, foreign_key: true
      t.integer :ordered_index, null: false
      t.timestamps

      t.references :external_scramble_set, null: true, index: true, foreign_key: true

      t.index %i[round_id ordered_index], unique: true, name: :ordering_sequence
    end

    create_table :matched_scrambles do |t|
      t.references :matched_scramble_set, null: false, index: true, foreign_key: { on_delete: :cascade }
      t.integer :ordered_index, null: false
      t.boolean :is_extra, null: false, default: false
      t.text :scramble_string, null: false
      t.timestamps

      t.references :external_scramble, null: true, index: true, foreign_key: true

      t.index %i[matched_scramble_set_id ordered_index], unique: true, name: :ordering_sequence
    end
  end
end
