# frozen_string_literal: true

class AddResultsSubmittedAtToCompetition < ActiveRecord::Migration[5.2]
  def change
    add_column :Competitions, :results_submitted_at, :datetime
    # Updated existing competition with posted results
    Competition.update_all("results_submitted_at = results_posted_at")
  end
end
