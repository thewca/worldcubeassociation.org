class CreateSchedules < ActiveRecord::Migration[5.1]
  def change
    create_table :competition_schedules do |t|
      t.string :competition_id, null: false
      t.date :start_date
      t.integer :number_of_days

      t.timestamps
    end
    add_index :competition_schedules, :competition_id, unique: true
  end
end
