# frozen_string_literal: true

class ChangeRegistrationRequirementsColumnName < ActiveRecord::Migration[5.2]
  def change
    rename_column :Competitions, :registration_requirements, :extra_registration_requirements
  end
end
