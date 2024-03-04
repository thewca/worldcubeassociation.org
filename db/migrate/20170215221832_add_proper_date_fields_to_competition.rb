# frozen_string_literal: true

class AddProperDateFieldsToCompetition < ActiveRecord::Migration
  def up
    add_column :Competitions, :start_date, :date
    add_index :Competitions, :start_date
    add_column :Competitions, :end_date, :date
    add_index :Competitions, :end_date

    execute <<-SQL
      UPDATE Competitions SET start_date=CONCAT(year, '-', month, '-', day) WHERE year != 0 AND month != 0 AND day != 0;
    SQL

    execute <<-SQL
      UPDATE Competitions SET end_date=CONCAT(endYear, '-', endMonth, '-', endDay) WHERE endYear != 0 AND endMonth != 0 AND endDay != 0;
    SQL
  end

  def down
    remove_column :Competitions, :end_date
    remove_column :Competitions, :start_date
  end
end
