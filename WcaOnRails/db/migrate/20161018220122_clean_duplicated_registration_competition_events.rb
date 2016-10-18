# frozen_string_literal: true
class CleanDuplicatedRegistrationCompetitionEvents < ActiveRecord::Migration
  def change
    execute <<-SQL
      DELETE FROM registration_competition_events
      WHERE registration_competition_events.id NOT IN (
        SELECT minid
        FROM (
          SELECT MIN(id) as minid
          FROM registration_competition_events
          GROUP BY registration_id, competition_event_id
        ) as keep
      )
    SQL
  end
end
