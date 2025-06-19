# frozen_string_literal: true

class CreatePotentialDuplicatePeople < ActiveRecord::Migration[7.2]
  def change
    create_table :potential_duplicate_people do |t|
      t.references :duplicate_checker_job, null: false, foreign_key: { to_table: :duplicate_checker_jobs }
      t.references :original_user, type: :integer, null: false, foreign_key: { to_table: :users }
      t.references :duplicate_person, type: :integer, null: false, foreign_key: { to_table: :persons }
      t.string :algorithm, null: false
      t.integer :score, null: false
      t.timestamps
    end
  end
end
