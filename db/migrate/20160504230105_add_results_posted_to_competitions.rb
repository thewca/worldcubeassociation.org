# frozen_string_literal: true

class AddResultsPostedToCompetitions < ActiveRecord::Migration
  def up
    add_column :Competitions, :results_posted_at, :datetime
    execute <<-SQL
      UPDATE Competitions
      SET results_posted_at = (SELECT MIN(updated_at) FROM Results where competitionId = Competitions.id)
      WHERE results_posted_at is NULL AND id IN (SELECT competitionId FROM Results)
    SQL
  end

  def down
    remove_column :Competitions, :results_posted
  end
end
