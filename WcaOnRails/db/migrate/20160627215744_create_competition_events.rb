# frozen_string_literal: true

class CreateCompetitionEvents < ActiveRecord::Migration
  def up
    create_table :competition_events do |t|
      t.string :competition_id, null: false
      t.string :event_id, null: false
    end
    add_foreign_key :competition_events, :Events, column: :event_id
    add_index :competition_events, [:competition_id, :event_id], unique: true

    # Move the data to the new table.
    Competition.all.each do |competition|
      # See https://github.com/thewca/worldcubeassociation.org/issues/95 for
      # what these equal signs are about.
      (competition.eventSpecs || []).split.each do |event_spec|
        event = Event.find(event_spec.split("=")[0])
        execute "insert into competition_events (competition_id, event_id) values ('#{competition.id}', '#{event.id}');"
      end
    end
  end

  def down
    drop_table :competition_events
  end
end
