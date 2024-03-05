# frozen_string_literal: true

class AddAllowRegistrationWithoutQualificationToCompetitions < ActiveRecord::Migration[6.1]
  def change
    # Default to false.
    add_column :Competitions, :allow_registration_without_qualification, :boolean, default: false

    # For already-announced competitions, default to the previous behavior.
    Competition.where("registration_close >= :close", close: DateTime.now).update_all(allow_registration_without_qualification: true)
  end
end
