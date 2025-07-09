# frozen_string_literal: true

class CreatePotentialDuplicatePersons < ActiveRecord::Migration[7.2]
  def change
    create_table :potential_duplicate_persons do |t|
      t.references :duplicate_checker_job_run, null: false, foreign_key: true
      t.references :original_user, type: :integer, null: false, foreign_key: { to_table: :users }
      t.references :duplicate_person, type: :integer, null: false, foreign_key: { to_table: :persons }
      t.string :name_matching_algorithm, null: false
      t.integer :score, null: false
      t.timestamps
    end
  end
end
