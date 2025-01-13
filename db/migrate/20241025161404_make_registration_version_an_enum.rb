# frozen_string_literal: true

class MakeRegistrationVersionAnEnum < ActiveRecord::Migration[7.2]
  def up
    add_column :Competitions, :registration_version, :integer, default: 0, null: false

    # Update values based on the old boolean column
    Competition.where(uses_v2_registrations: true).update_all(registration_version: Competition.registration_versions[:v2])

    # Remove the old column
    remove_column :Competitions, :uses_v2_registrations
  end

  def down
    # Add back the original boolean column
    add_column :Competitions, :uses_v2_registrations, :boolean, default: false, null: false

    # Map back enum values to the boolean
    Competition.where(registration_version: Competition.registration_versions[:v2]).update_all(uses_v2_registrations: true)

    # Remove the enum column and rename the boolean column back
    remove_column :Competitions, :registration_version
  end
end
