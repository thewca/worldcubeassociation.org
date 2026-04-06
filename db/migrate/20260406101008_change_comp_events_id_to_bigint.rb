# frozen_string_literal: true

class ChangeCompEventsIdToBigint < ActiveRecord::Migration[8.1]
  def change
    reversible do |dir|
      dir.up do
        change_column :competition_events, :id, :bigint

        change_column :registration_competition_events, :competition_event_id, :bigint
        change_column :rounds, :competition_event_id, :bigint

        change_column :registration_competition_events, :id, :bigint
      end

      dir.down do
        change_column :registration_competition_events, :id, :integer

        change_column :rounds, :competition_event_id, :integer
        change_column :registration_competition_events, :competition_event_id, :integer

        change_column :competition_events, :id, :integer
      end
    end

    add_foreign_key :rounds, :competition_events, on_delete: :cascade
    add_foreign_key :registration_competition_events, :competition_events, on_delete: :cascade
  end
end
