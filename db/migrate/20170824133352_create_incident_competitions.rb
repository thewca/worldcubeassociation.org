# frozen_string_literal: true

class CreateIncidentCompetitions < ActiveRecord::Migration[5.1]
  def change
    create_table :incident_competitions do |t|
      t.references :incident, null: false
      t.string :competition_id, null: false
      t.string :comments
    end

    add_index :incident_competitions, [:incident_id, :competition_id], unique: true
  end
end
