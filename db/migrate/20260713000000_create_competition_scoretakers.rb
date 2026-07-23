# frozen_string_literal: true

class CreateCompetitionScoretakers < ActiveRecord::Migration[8.1]
  def change
    create_table :competition_scoretakers do |t|
      t.string :competition_id, null: false
      t.integer :user_id, null: false, index: true
      t.timestamps

      t.index %i[competition_id user_id], unique: true
    end
  end
end
