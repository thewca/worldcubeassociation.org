# frozen_string_literal: true

class CreateIncidentTags < ActiveRecord::Migration[5.1]
  def change
    create_table :incident_tags do |t|
      t.references :incident, null: false
      t.string :tag, null: false
    end

    add_index :incident_tags, :tag
    add_index :incident_tags, [:incident_id, :tag], unique: true
  end
end
