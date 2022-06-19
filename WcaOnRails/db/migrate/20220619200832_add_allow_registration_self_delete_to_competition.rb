# frozen_string_literal: true

class AddAllowRegistrationSelfDeleteToCompetition < ActiveRecord::Migration[6.1]
  def change
    add_column :Competitions, :allow_registration_self_delete_after_acceptance, :bool, null: false, default: false
  end
end
