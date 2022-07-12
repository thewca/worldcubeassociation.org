# frozen_string_literal: true

class AddAllowRegistrationWithoutQualificationToCompetitions < ActiveRecord::Migration[6.1]
  def change
    add_column :Competitions, :allow_registration_without_qualification, :boolean, default: false
  end
end
