# frozen_string_literal: true
class CreateCommitteePositions < ActiveRecord::Migration
  def change
    create_table :committee_positions do |t|
      t.string :name, limit: 50, null: false
      t.string :slug, limit: 50, null: false
      t.string :description, limit: 255, null: false
      t.boolean :team_leader, null: false
      t.references :committee, index: true, foreign_key: true

      t.timestamps null: false
    end
    add_index :committee_positions, [:committee_id, :slug], unique: true
  end
end
