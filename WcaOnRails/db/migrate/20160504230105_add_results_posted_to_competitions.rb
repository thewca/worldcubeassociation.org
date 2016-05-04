class AddResultsPostedToCompetitions < ActiveRecord::Migration
  def up
    add_column :Competitions, :results_posted, :datetime
    execute <<-SQL
      UPDATE Competitions
      SET results_posted = (SELECT max(updated_at) FROM Results)
      WHERE results_posted is NULL AND id IN (SELECT competitionId FROM Results)
    SQL
  end

  def down
    remove_column :Competitions, :results_posted
  end
end
