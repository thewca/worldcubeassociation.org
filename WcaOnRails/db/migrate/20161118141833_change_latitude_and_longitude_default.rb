# frozen_string_literal: true
class ChangeLatitudeAndLongitudeDefault < ActiveRecord::Migration
  def up
    change_column_default(:Competitions, :latitude, nil)
    change_column_default(:Competitions, :longitude, nil)
  end

  def down
    change_column_default(:Competitions, :latitude, 0)
    change_column_default(:Competitions, :longitude, 0)
  end
end
