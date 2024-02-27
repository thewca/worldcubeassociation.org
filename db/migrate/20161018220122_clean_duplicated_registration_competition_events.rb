# frozen_string_literal: true

class CleanDuplicatedRegistrationCompetitionEvents < ActiveRecord::Migration
  def up
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

    add_index :registration_competition_events, [:registration_id, :competition_event_id],
              unique: true, name: "idx_registration_competition_events_on_reg_id_and_comp_event_id"
  end

  def down
    remove_index :registration_competition_events, name: "idx_registration_competition_events_on_reg_id_and_comp_event_id"
  end
end
