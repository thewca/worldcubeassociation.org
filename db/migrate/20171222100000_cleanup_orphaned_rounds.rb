# frozen_string_literal: true

class CleanupOrphanedRounds < ActiveRecord::Migration[5.1]
  def change
    Round.joins("LEFT OUTER JOIN competition_events ON rounds.competition_event_id = competition_events.id")
         .where('competition_events.id': nil).delete_all
  end
end
