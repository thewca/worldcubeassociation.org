# frozen_string_literal: true

class CreateDelegateReports < ActiveRecord::Migration
  def change
    create_table :delegate_reports do |t|
      t.string :competition_id

      t.text :equipment
      t.text :venue
      t.text :organisation
      t.string :schedule_url
      t.text :incidents
      t.text :remarks

      t.string :discussion_url

      t.integer :posted_by_user_id
      t.datetime :posted_at

      t.timestamps null: false
    end
    add_index :delegate_reports, :competition_id, unique: true
  end
end
