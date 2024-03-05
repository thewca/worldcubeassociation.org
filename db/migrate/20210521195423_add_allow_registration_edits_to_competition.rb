# frozen_string_literal: true

class AddAllowRegistrationEditsToCompetition < ActiveRecord::Migration[5.2]
  def change
    add_column :Competitions, :allow_registration_edits, :bool, null: false, default: false
  end
end
