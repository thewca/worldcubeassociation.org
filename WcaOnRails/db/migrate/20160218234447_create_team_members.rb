class CreateTeamMembers < ActiveRecord::Migration
  def change
    create_table :team_members do |t|
      t.integer :team_id, null: false
      t.integer :user_id, null: false
      t.date :start_date, null: false
      t.date :end_date, default: nil

      t.timestamps null: false
    end
  end
end
