# frozen_string_literal: true

class CreateCompetitionScoretakers < ActiveRecord::Migration[8.1]
  def change
    create_table :competition_scoretakers do |t|
      t.string :competition_id, null: false
      t.integer :user_id, null: false
      t.timestamps
    end
    add_index :competition_scoretakers, %i[competition_id user_id], unique: true
    add_index :competition_scoretakers, :user_id
  end
end
