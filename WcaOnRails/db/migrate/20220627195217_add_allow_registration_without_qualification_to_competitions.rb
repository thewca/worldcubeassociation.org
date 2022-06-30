# frozen_string_literal: true

class AddAllowRegistrationWithoutQualificationToCompetitions < ActiveRecord::Migration[5.2]
  def change
    add_column :Competitions, :allow_registration_without_qualification, :boolean, default: true
  end
end
