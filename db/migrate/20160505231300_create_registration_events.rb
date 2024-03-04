# frozen_string_literal: true

class CreateRegistrationEvents < ActiveRecord::Migration
  def change
    create_table :registration_events do |t|
      t.references :registration
      t.string :event_id
    end
    add_index :registration_events, [:registration_id, :event_id], unique: true

    # Move the data to the new table.
    Registration.all.each do |registration|
      (registration.eventIds || "").split.each do |event_id|
        RegistrationEvent.create!(registration_id: registration.id, event_id: event_id)
      end
    end

    # Finally remove the unnecessary column.
    remove_column :Preregs, :eventIds
  end
end
