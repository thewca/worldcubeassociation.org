# frozen_string_literal: true

class AddRegistrationRequirementsToCompetitions < ActiveRecord::Migration[5.1]
  def change
    add_column :Competitions, :registration_requirements, :text
  end
end
