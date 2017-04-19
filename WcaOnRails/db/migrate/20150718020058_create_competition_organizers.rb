# frozen_string_literal: true

class CreateCompetitionOrganizers < ActiveRecord::Migration
  def change
    create_table :competition_organizers do |t|
      t.string :competition_id
      t.integer :organizer_id

      t.timestamps null: false
    end
    add_index :competition_organizers, :competition_id
    add_index :competition_organizers, :organizer_id
    add_index :competition_organizers, [:competition_id, :organizer_id], unique: true, name: "idx_competition_organizers_on_competition_id_and_organizer_id"
  end
end
