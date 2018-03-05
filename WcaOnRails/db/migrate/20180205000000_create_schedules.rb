class CreateSchedules < ActiveRecord::Migration[5.1]
  def change
    create_table :competition_schedules do |t|
      t.references :competition
      t.date :start_date
      t.integer :number_of_days

      t.timestamps
    end
  end
end
