# frozen_string_literal: true

class AddEndYearToCompetitions < ActiveRecord::Migration
  def change
    add_column :Competitions, :endYear, :smallint, unsigned: true, null: false, default: 0
    Competition.update_all("endYear=year")
  end
end
