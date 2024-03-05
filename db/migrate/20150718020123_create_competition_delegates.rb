# frozen_string_literal: true

class CreateCompetitionDelegates < ActiveRecord::Migration
  def change
    create_table :competition_delegates do |t|
      t.string :competition_id
      t.integer :delegate_id

      t.timestamps null: false
    end
    add_index :competition_delegates, :competition_id
    add_index :competition_delegates, :delegate_id
    add_index :competition_delegates, [:competition_id, :delegate_id], unique: true
  end
end
