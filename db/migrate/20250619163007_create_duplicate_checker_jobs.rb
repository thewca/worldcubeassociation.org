# frozen_string_literal: true

class CreateDuplicateCheckerJobs < ActiveRecord::Migration[7.2]
  def change
    create_table :duplicate_checker_jobs do |t|
      t.references :competition, null: false, type: :string
      t.datetime :start_time
      t.datetime :end_time
      t.string :status, null: false
      t.timestamps
    end
  end
end
