# frozen_string_literal: true

class CreateTeamMembers < ActiveRecord::Migration
  def change
    create_table :team_members do |t|
      t.integer :team_id, null: false
      t.integer :user_id, null: false
      t.date :start_date, null: false
      t.date :end_date, default: nil
      t.boolean :team_leader, default: false, null: false

      t.timestamps null: false
    end
  end
end
