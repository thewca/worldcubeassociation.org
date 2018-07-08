class AddResultsSubmittedAtToCompetition < ActiveRecord::Migration[5.2]
  def change
    add_column :Competitions, :results_submitted_at, :datetime
  end
end
