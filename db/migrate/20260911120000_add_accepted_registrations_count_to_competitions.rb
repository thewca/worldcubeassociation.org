# frozen_string_literal: true

class AddAcceptedRegistrationsCountToCompetitions < ActiveRecord::Migration[8.1]
  def up
    add_column :competitions, :accepted_registrations_count, :integer, default: 0, null: false

    Registration.counter_culture_fix_counts(only: :competition)
  end

  def down
    remove_column :competitions, :accepted_registrations_count
  end
end
