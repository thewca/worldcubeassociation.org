# frozen_string_literal: true

class AddH2HModels < ActiveRecord::Migration[8.1]
  def change
    create_table :h2h_matches do |t|
      t.references :round, type: :integer, null: false, foreign_key: true
      t.integer :match_number, limit: 1, null: false
      t.timestamps
    end

    create_table :h2h_match_competitors do |t|
      t.references :h2h_match, null: false, foreign_key: true
      t.references :user, type: :integer, null: false, foreign_key: true
      t.timestamps
      t.index %i[h2h_match_id user_id], unique: true
    end

    create_table :h2h_sets do |t|
      t.references :h2h_match, null: false, foreign_key: true
      t.integer :set_number, limit: 1, null: false
      t.timestamps
    end

    create_table :h2h_attempts do |t|
      t.references :h2h_set, null: false, foreign_key: true
      t.references :live_attempt, foreign_key: true
      t.references :result_attempt, foreign_key: true
      t.references :h2h_match_competitor, null: false, foreign_key: true
      t.integer :set_attempt_number, limit: 1, null: false
      t.timestamps
    end
  end
end
