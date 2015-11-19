class AddRemarksToCompetitions < ActiveRecord::Migration
  def change
    add_column :Competitions, :remarks, :text
  end
end
