# frozen_string_literal: true

class AddForeignKeyFromRceToRegistrations < ActiveRecord::Migration[8.1]
  def change
    reversible do |dir|
      dir.up do
        execute "DELETE FROM registration_competition_events WHERE registration_id NOT IN (SELECT id FROM registrations)"

        change_column :registrations, :id, :bigint

        change_column :registration_payments, :registration_id, :bigint
        change_column :registration_competition_events, :registration_id, :bigint
      end

      dir.down do
        change_column :registration_competition_events, :registration_id, :integer
        change_column :registration_payments, :registration_id, :integer

        change_column :registrations, :id, :integer, unsigned: true
      end
    end

    add_foreign_key :registration_competition_events, :registrations, on_delete: :cascade
  end
end
