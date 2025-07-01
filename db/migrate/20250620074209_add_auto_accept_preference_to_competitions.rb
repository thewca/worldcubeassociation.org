# frozen_string_literal: true

class AddAutoAcceptPreferenceToCompetitions < ActiveRecord::Migration[7.2]
  def change
    add_column :competitions, :auto_accept_preference, :integer, default: 0, null: false

    reversible do |direction|
      direction.up do
        execute <<~SQL.squish
          UPDATE competitions
          SET auto_accept_preference = CASE
            WHEN auto_accept_registrations = TRUE THEN 1
            ELSE 0
          END
        SQL
      end
    end
  end
end
