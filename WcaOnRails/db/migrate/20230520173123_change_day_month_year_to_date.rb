# frozen_string_literal: true

class ChangeDayMonthYearToDate < ActiveRecord::Migration[7.0]
  def change
    add_column :Persons, :dob, :date, null: true
    execute "UPDATE Persons SET dob = IF(year=0 OR month=0 OR day=0, NULL, DATE(CONCAT_WS('-', year, month, day))) WHERE 1;"
    remove_column :Persons, :day
    remove_column :Persons, :month
    remove_column :Persons, :year

    # Competitions table already has redundant date columns, so just remove the old PHP ones.
    remove_column :Competitions, :day
    remove_column :Competitions, :month
    remove_column :Competitions, :year
    remove_column :Competitions, :endDay
    remove_column :Competitions, :endMonth
    remove_column :Competitions, :endYear
  end
end
