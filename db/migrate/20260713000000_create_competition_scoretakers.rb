# frozen_string_literal: true

class CreateCompetitionScoretakers < ActiveRecord::Migration[8.1]
  def change
    create_table :competition_scoretakers do |t|
      t.string :competition_id, null: false
      t.integer :user_id, null: false
      t.timestamps

      t.index %i[competition_id user_id], unique: true
      t.index :user_id
    end
  end
end
