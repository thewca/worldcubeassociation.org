# frozen_string_literal: true

class AddEventsPerRegistrationLimitToCompetitions < ActiveRecord::Migration[7.0]
  def change
    add_column :Competitions, :events_per_registration_limit, :integer
  end
end
