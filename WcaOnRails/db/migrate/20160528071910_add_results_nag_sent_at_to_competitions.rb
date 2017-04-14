# frozen_string_literal: true

class AddResultsNagSentAtToCompetitions < ActiveRecord::Migration
  def change
    add_column :Competitions, :results_nag_sent_at, :datetime
  end
end
