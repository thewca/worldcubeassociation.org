# frozen_string_literal: true

class ChangeLatitudeAndLongitudeDefault < ActiveRecord::Migration
  def up
    change_column_null(:Competitions, :latitude, true)
    change_column_null(:Competitions, :longitude, true)
    change_column_default(:Competitions, :latitude, default: nil)
    change_column_default(:Competitions, :longitude, default: nil)

    execute <<-SQL
      UPDATE Competitions
      SET latitude = NULL, longitude = NULL
      WHERE (latitude = 0 AND longitude = 0)
    SQL
  end

  def down
    change_column_default(:Competitions, :latitude, 0)
    change_column_default(:Competitions, :longitude, 0)
    change_column_null(:Competitions, :latitude, false, 0)
    change_column_null(:Competitions, :longitude, false, 0)
  end
end
