# frozen_string_literal: true

class AddAutoAcceptPreferenceToCompetitions < ActiveRecord::Migration[7.2]
  def change
    add_column :competitions, :auto_accept_preference, :integer, default: 0, null: false

    reversible do |direction|
      direction.up do
        # Booleans are stored as 0 (false) and 1 (true) the database
        # By setting up the enum to have 0 as disabled and 1 as bulk, we can replicate the current settings users have in production
        # By simply setting the new field to be equal to the existing value in `auto_accept_registrations`
        execute <<~SQL.squish
          UPDATE competitions
          SET auto_accept_preference = auto_accept_registrations
        SQL
      end
    end
  end
end
