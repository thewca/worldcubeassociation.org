class RemoveUnnecessaryColumnsFromCountries < ActiveRecord::Migration
  def change
    remove_columns :Countries, :longitude, :latitude, :zoom
  end
end
