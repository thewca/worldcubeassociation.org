class CreateCompetitionEvents < ActiveRecord::Migration
  def up
    create_table :competition_events, id: false do |t|
      t.string :competition_id, limit: 32, null: false
      t.string :event_id, limit: 6, null: false
    end
    add_foreign_key :competition_events, :Competitions, column: :competition_id
    add_foreign_key :competition_events, :Events, column: :event_id
    execute "ALTER TABLE competition_events ADD PRIMARY KEY (competition_id, event_id);"

    # Move the data to the new table.
    Competition.all.each do |competition|
      (competition.eventSpecs || []).split.each do |event_spec|
        event = Event.find_by_id(event_spec.split("=")[0])
        ActiveRecord::Base.connection.execute("insert into competition_events (competition_id, event_id) values ('#{competition.id}',  '#{event.id}');") 
      end
    end
  end

  def down
    drop_table :competition_events
  end
end
