# frozen_string_literal: true

class ConvertEventIdToCompetitionEventId < ActiveRecord::Migration
  def up
    add_column :registration_events, :competition_event_id, :int
    execute <<-SQL
      UPDATE registration_events
      JOIN Preregs ON Preregs.id = registration_events.registration_id
      JOIN competition_events ON competition_events.competition_id = Preregs.competitionId AND competition_events.event_id = registration_events.event_id
      SET competition_event_id = competition_events.id
    SQL
    remove_index :registration_events, [:registration_id, :event_id]
    remove_column :registration_events, :event_id

    rename_table :registration_events, :registration_competition_events
    add_index :registration_competition_events, [:registration_id, :competition_event_id], name: "index_reg_events_reg_id_comp_event_id"
  end

  def down
    remove_index :registration_competition_events, [:registration_id, :competition_event_id], name: "index_reg_events_reg_id_comp_event_id"
    rename_table :registration_competition_events, :registration_events

    add_column :registration_events, :event_id, :string
    execute <<-SQL
      UPDATE registration_events
      JOIN competition_events ON competition_events.id = registration_events.competition_event_id
      SET registration_events.event_id = competition_events.event_id
    SQL
    add_index :registration_events, [:registration_id, :event_id], unique: true
    remove_column :registration_events, :competition_event_id
  end
end
